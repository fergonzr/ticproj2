"""Mock adapters for testing use cases.

This module provides simple in-memory implementations of the port interfaces
defined in the application layer. These mock adapters are designed for testing
purposes and use dictionaries to simulate persistent storage and service calls.
"""

import uuid
from datetime import datetime
from typing import AsyncGenerator, Dict, List, Optional, Tuple

import pytest

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.location_updater import ParamedicLocationUpdaterPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.ports.user_manager import UserManagerPort
from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.entities.user import Paramedic, User, UserRole
from core.domain.value_objects.location import Location


class MockRealTimeStoragePort(RealTimeStoragePort):
    """Mock implementation of RealTimeStoragePort using in-memory dictionaries.

    This mock adapter simulates a real-time storage database using dictionaries
    to store emergencies and paramedics. It provides thread-safe operations
    for testing purposes.
    """

    def __init__(self):
        """Initialize the mock storage with empty dictionaries."""
        self._emergencies: Dict[datetime, Emergency] = {}
        self._paramedics: Dict[uuid.UUID, Paramedic] = {}
        self._emergency_calls: List[Tuple[str, Emergency]] = []
        self._paramedic_calls: List[Tuple[str, Paramedic]] = []

    async def save_emergency(self, emergency: Emergency):
        """Save an emergency to the mock storage.

        Args:
            emergency: The Emergency entity to save.
        """
        self._emergencies[emergency.timeline[EmergencyStatus.RECEIVED]] = emergency
        self._emergency_calls.append(("save_emergency", emergency))

    async def get_emergency(self, createdOn: datetime) -> Optional[Emergency]:
        """Get an emergency from the mock storage.

        Args:
            createdOn: The timestamp when the emergency was created.

        Returns:
            The Emergency entity if found, None otherwise.
        """
        return self._emergencies.get(createdOn)

    async def get_paramedic(self, paramedicId: uuid.UUID) -> Optional[Paramedic]:
        """Get a paramedic from the mock storage.

        Args:
            paramedicId: The unique identifier of the paramedic.

        Returns:
            The Paramedic entity if found, None otherwise.
        """
        return self._paramedics.get(paramedicId)

    async def save_paramedic(self, paramedic: Paramedic):
        """Save a paramedic to the mock storage.

        Args:
            paramedic: The Paramedic entity to save.
        """
        self._paramedics[paramedic.id] = paramedic
        self._paramedic_calls.append(("save_paramedic", paramedic))

    async def delete_paramedic(self, paramedicId: uuid.UUID) -> Optional[Paramedic]:
        """Delete a paramedic from the mock storage.

        Args:
            paramedicId: The unique identifier of the paramedic.

        Returns:
            The deleted Paramedic entity if found, None otherwise.
        """
        paramedic = self._paramedics.pop(paramedicId, None)
        if paramedic:
            self._paramedic_calls.append(("delete_paramedic", paramedic))
        return paramedic

    async def get_nearby_paramedics(
        self, location: Location
    ) -> AsyncGenerator[Paramedic, None]:
        """Get all paramedics near a given location, sorted by proximity.

        Args:
            location: The location to search near.

        Returns:
            An async generator that yields paramedics sorted by proximity
            to the given location, closest first.
        """
        # Convert the dictionary to a list of paramedics
        paramedics = list(self._paramedics.values())

        # Sort paramedics by distance to the target location
        # We'll use a simple distance approximation (Euclidean distance)
        def distance(paramedic: Paramedic) -> float:
            if paramedic.resource is None or paramedic.resource.location is None:
                return float("inf")  # Put paramedics without resources at the end

            resource_loc = paramedic.resource.location
            dx = resource_loc.latitude - location.latitude
            dy = resource_loc.longitude - location.longitude
            return dx * dx + dy * dy  # Squared distance for simplicity

        # Sort paramedics by distance
        sorted_paramedics = sorted(paramedics, key=distance)

        # Yield each paramedic one by one (simulating async generation)
        for paramedic in sorted_paramedics:
            yield paramedic

    def get_emergency_calls(self) -> List[Tuple[str, Emergency]]:
        """Get a list of all emergency-related method calls.

        Returns:
            A list of tuples containing the method name and the Emergency entity.
        """
        return self._emergency_calls.copy()

    def get_paramedic_calls(self) -> List[Tuple[str, Paramedic]]:
        """Get a list of all paramedic-related method calls.

        Returns:
            A list of tuples containing the method name and the Paramedic entity.
        """
        return self._paramedic_calls.copy()

    def clear(self):
        """Clear all stored data for test isolation."""
        self._emergencies.clear()
        self._paramedics.clear()
        self._emergency_calls.clear()
        self._paramedic_calls.clear()


@pytest.fixture
def mock_realtime_storage() -> MockRealTimeStoragePort:
    return MockRealTimeStoragePort()


class MockCoordinatorPort(CoordinatorPort):
    """Mock implementation of CoordinatorPort for testing.

    This mock adapter tracks calls to the coordinator methods and provides
    a way to verify that the use cases are properly coordinating emergency
    responses.
    """

    def __init__(self):
        """Initialize the mock coordinator with empty call tracking."""
        self._report_emergency_calls: List[Emergency] = []
        self._report_assignment_calls: List[Tuple[Emergency, Paramedic]] = []

    async def report_emergency(self, emergency: Emergency):
        """Report an emergency to the mock coordinator.

        Args:
            emergency: The Emergency entity to report.
        """
        self._report_emergency_calls.append(emergency)

    async def report_assignment(self, emergency: Emergency, paramedic: Paramedic):
        """Report an emergency assignment to the mock coordinator.

        Args:
            emergency: The Emergency entity that was assigned.
            paramedic: The Paramedic that was assigned to the emergency.
        """
        self._report_assignment_calls.append((emergency, paramedic))

    def get_report_emergency_calls(self) -> List[Emergency]:
        """Get a list of all emergencies reported to the coordinator.

        Returns:
            A list of Emergency entities that were reported.
        """
        return self._report_emergency_calls.copy()

    def get_report_assignment_calls(self) -> List[Tuple[Emergency, Paramedic]]:
        """Get a list of all assignments reported to the coordinator.

        Returns:
            A list of tuples containing the Emergency and Paramedic for each assignment.
        """
        return self._report_assignment_calls.copy()

    def clear(self):
        """Clear all tracked calls for test isolation."""
        self._report_emergency_calls.clear()
        self._report_assignment_calls.clear()


@pytest.fixture
def mock_coordinator_port() -> MockCoordinatorPort:
    return MockCoordinatorPort()


class MockParamedicLocationUpdaterPort(ParamedicLocationUpdaterPort):
    """Mock implementation of ParamedicLocationUpdaterPort for testing.

    This mock adapter tracks requests for emergency assignments and provides
    a way to verify that the use cases are properly requesting assignments
    from paramedics.
    """

    def __init__(self):
        """Initialize the mock location updater with empty call tracking."""
        self._request_calls: List[Tuple[uuid.UUID, Emergency, str]] = []

    async def request_emergency_assignment(
        self, paramedicId: uuid.UUID, emergency: Emergency, confirmationURL: str
    ):
        """Request an emergency assignment from a paramedic.

        Args:
            paramedicId: The unique identifier of the paramedic.
            emergency: The Emergency entity to assign.
            confirmationURL: The URL for the paramedic to confirm the assignment.
        """
        self._request_calls.append((paramedicId, emergency, confirmationURL))

    def get_request_calls(self) -> List[Tuple[uuid.UUID, Emergency, str]]:
        """Get a list of all assignment requests.

        Returns:
            A list of tuples containing the paramedic ID, Emergency, and confirmation URL.
        """
        return self._request_calls.copy()

    def clear(self):
        """Clear all tracked calls for test isolation."""
        self._request_calls.clear()


@pytest.fixture
def mock_location_updater() -> MockParamedicLocationUpdaterPort:
    return MockParamedicLocationUpdaterPort()


class MockUserManagerPort(UserManagerPort):
    """Mock implementation of UserManagerPort for testing.

    This mock adapter simulates a user management service that can retrieve
    users by their unique identifier. It maintains an in-memory dictionary
    of users and tracks all retrieval requests for testing purposes.

    Note: This implementation returns generic User objects, not type-specific
    user objects. The caller is responsible for converting to the appropriate
    subclass based on the userRole field.
    """

    def __init__(self):
        """Initialize the mock user manager with empty storage."""
        self._users: Dict[uuid.UUID, User] = {}
        self._get_user_calls: List[uuid.UUID] = []

    async def get_user(self, id: uuid.UUID) -> User | None:
        """Get a user by ID from the mock storage.

        Args:
            id: The unique identifier of the user to retrieve.

        Returns:
            The User entity if found, None otherwise. The caller is responsible
            for converting it to the appropriate subclass according to its
            userRole field if needed.
        """
        user = self._users.get(id)
        if user:
            self._get_user_calls.append(id)
        return user

    async def get_user_by_email(self, email: str) -> User | None:
        """Get a user by email from the mock storage.

        Args:
            email: The email address of the user to retrieve.

        Returns:
            The User entity if found, None otherwise. The caller is responsible
            for converting it to the appropriate subclass according to its
            userRole field if needed.
        """
        matched_users = [user for user in self._users.values() if user.email == email]
        return matched_users[0] if matched_users else None

    def add_user(self, user: User):
        """Add a user to the mock storage for testing purposes.

        Args:
            user: The User entity to add to the storage.
        """
        self._users[user.id] = user

    def get_get_user_calls(self) -> List[uuid.UUID]:
        """Get a list of all user retrieval requests.

        Returns:
            A list of user IDs that were requested.
        """
        return self._get_user_calls.copy()

    def clear(self):
        """Clear all stored data for test isolation."""
        self._users.clear()
        self._get_user_calls.clear()


@pytest.fixture
def mock_user_manager() -> MockUserManagerPort:
    return MockUserManagerPort()
