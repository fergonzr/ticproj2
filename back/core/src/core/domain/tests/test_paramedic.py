"""Unit tests for the Paramedic entity.

This module contains unit tests for the Paramedic class, focusing on:
1. Paramedic initialization and property verification
2. Location updates
3. Emergency assignment
4. Exception handling for invalid states
"""

import uuid
from datetime import datetime

import pytest

from core.domain.entities.user import (
    BusyResourceError,
    Paramedic,
    UnavailableResourceError,
)
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource


class TestParamedicInitialization:
    """Test cases for Paramedic initialization."""

    def test_init_with_all_parameters(self):
        """Test that Paramedic initializes correctly with all parameters."""
        paramedic_id = uuid.uuid4()
        resource = LocatableResource(
            location=Location(latitude=1.0, longitude=2.0), busy=False
        )
        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            passwordHash="hashed_password_all_params",
            resource=resource,
            assignedEmergencyId=emergency_id,
        )

        assert paramedic.id == paramedic_id
        assert paramedic.name == "John Doe"
        assert paramedic.email == "john.doe@example.com"
        assert paramedic.resource == resource
        assert paramedic.assignedEmergencyId == emergency_id

    def test_init_with_default_parameters(self):
        """Test that Paramedic initializes correctly with default parameters."""
        paramedic_id = uuid.uuid4()

        paramedic = Paramedic(
            id=paramedic_id,
            name="Jane Smith",
            email="jane.smith@example.com",
            passwordHash="hashed_password_default",
        )

        assert paramedic.id == paramedic_id
        assert paramedic.name == "Jane Smith"
        assert paramedic.email == "jane.smith@example.com"
        assert paramedic.resource is None
        assert paramedic.assignedEmergencyId is None

    def test_init_preserves_user_properties(self):
        """Test that Paramedic preserves User properties correctly."""
        paramedic_id = uuid.uuid4()

        paramedic = Paramedic(
            id=paramedic_id,
            name="Bob Johnson",
            email="bob.johnson@example.com",
            passwordHash="hashed_password_preserve",
        )

        # Verify User properties are preserved
        assert paramedic.id == paramedic_id
        assert paramedic.name == "Bob Johnson"
        assert paramedic.email == "bob.johnson@example.com"


class TestParamedicLocationUpdate:
    """Test cases for Paramedic location updates."""

    def test_update_location_with_valid_resource(self):
        """Test that location update works when resource is available."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=False)

        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            passwordHash="hashed_password_location_update",
            resource=resource,
        )

        new_location = Location(latitude=3.0, longitude=4.0)
        paramedic.update_location(new_location)

        assert paramedic.resource.location == new_location
        assert paramedic.resource.location.latitude == 3.0
        assert paramedic.resource.location.longitude == 4.0

    def test_update_location_with_none_resource(self):
        """Test that location update can be made with a paramedic whose resource is None"""
        paramedic_id = uuid.uuid4()

        paramedic = Paramedic(
            id=paramedic_id,
            name="Jane Smith",
            email="jane.smith@example.com",
            passwordHash="hashed_password_none_resource",
            resource=None,
        )

        new_location = Location(latitude=3.0, longitude=4.0)

        paramedic.update_location(new_location)

        assert paramedic.resource is not None
        assert paramedic.resource.location == new_location

    def test_update_location_preserves_other_properties(self):
        """Test that location update preserves other paramedic properties."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=False)
        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        paramedic = Paramedic(
            id=paramedic_id,
            name="Bob Johnson",
            email="bob.johnson@example.com",
            passwordHash="hashed_password_preserve_props",
            resource=resource,
            assignedEmergencyId=emergency_id,
        )

        new_location = Location(latitude=3.0, longitude=4.0)
        paramedic.update_location(new_location)

        # Verify other properties remain unchanged
        assert paramedic.id == paramedic_id
        assert paramedic.name == "Bob Johnson"
        assert paramedic.email == "bob.johnson@example.com"
        assert paramedic.assignedEmergencyId == emergency_id
        assert paramedic.resource.busy is False


class TestParamedicAssignment:
    """Test cases for Paramedic emergency assignment."""

    def test_assign_with_available_resource(self):
        """Test that assignment works when resource is available and not busy."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=False)

        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            passwordHash="hashed_password_assignment",
            resource=resource,
        )

        emergency_id = datetime(2023, 1, 1, 12, 0, 0)
        paramedic.assign(emergency_id)

        assert paramedic.resource.busy is True
        assert paramedic.assignedEmergencyId == emergency_id

    def test_assign_with_none_resource_raises_exception(self):
        """Test that assignment raises UnavailableResourceError when resource is None."""
        paramedic_id = uuid.uuid4()

        paramedic = Paramedic(
            id=paramedic_id,
            name="Jane Smith",
            email="jane.smith@example.com",
            passwordHash="hashed_password_none_resource_2",
            resource=None,
        )

        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        with pytest.raises(UnavailableResourceError) as exc_info:
            paramedic.assign(emergency_id)

        assert exc_info.value.id == paramedic_id

    def test_assign_with_busy_resource_raises_exception(self):
        """Test that assignment raises BusyResourceError when resource is busy."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=True)

        paramedic = Paramedic(
            id=paramedic_id,
            name="Bob Johnson",
            email="bob.johnson@example.com",
            passwordHash="hashed_password_busy_resource",
            resource=resource,
        )

        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        with pytest.raises(BusyResourceError) as exc_info:
            paramedic.assign(emergency_id)

        assert exc_info.value.id == paramedic_id

    def test_assign_updates_only_relevant_fields(self):
        """Test that assignment only updates the busy status and emergency ID."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=False)
        old_emergency_id = datetime(2023, 1, 1, 10, 0, 0)

        paramedic = Paramedic(
            id=paramedic_id,
            name="Alice Brown",
            email="alice.brown@example.com",
            passwordHash="hashed_password_relevant_fields",
            resource=resource,
            assignedEmergencyId=old_emergency_id,
        )

        new_emergency_id = datetime(2023, 1, 1, 12, 0, 0)
        paramedic.assign(new_emergency_id)

        # Verify only relevant fields are updated
        assert paramedic.resource.busy is True
        assert paramedic.assignedEmergencyId == new_emergency_id
        assert paramedic.id == paramedic_id
        assert paramedic.name == "Alice Brown"
        assert paramedic.email == "alice.brown@example.com"
        assert paramedic.resource.location == initial_location


class TestParamedicStateTransitions:
    """Test cases for Paramedic state transitions."""

    def test_initial_state(self):
        """Test that a newly created paramedic has the correct initial state."""
        paramedic_id = uuid.uuid4()

        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            passwordHash="hashed_password_initial",
        )

        assert paramedic.resource is None
        assert paramedic.assignedEmergencyId is None

    def test_assignment_changes_state(self):
        """Test that assignment changes the paramedic state correctly."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=False)

        paramedic = Paramedic(
            id=paramedic_id,
            name="Jane Smith",
            email="jane.smith@example.com",
            passwordHash="hashed_password_state_transition",
            resource=resource,
        )

        emergency_id = datetime(2023, 1, 1, 12, 0, 0)
        paramedic.assign(emergency_id)

        assert paramedic.resource.busy is True
        assert paramedic.assignedEmergencyId == emergency_id

    def test_location_update_does_not_affect_assignment(self):
        """Test that location update doesn't affect assignment state."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=False)
        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        paramedic = Paramedic(
            id=paramedic_id,
            name="Bob Johnson",
            email="bob.johnson@example.com",
            passwordHash="hashed_password_location_preserve",
            resource=resource,
            assignedEmergencyId=emergency_id,
        )

        new_location = Location(latitude=3.0, longitude=4.0)
        paramedic.update_location(new_location)

        # Verify assignment state is preserved
        assert paramedic.resource.busy is False  # Was not busy initially
        assert paramedic.assignedEmergencyId == emergency_id
        assert paramedic.resource.location == new_location


class TestParamedicExceptionHandling:
    """Test cases for Paramedic exception handling."""

    def test_unavailable_resource_error_message(self):
        """Test that UnavailableResourceError contains the correct resource ID."""
        paramedic_id = uuid.uuid4()

        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            passwordHash="hashed_password_unavailable",
            resource=None,
        )

        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        with pytest.raises(UnavailableResourceError) as exc_info:
            paramedic.assign(emergency_id)

        assert str(exc_info.value.id) == str(paramedic_id)

    def test_busy_resource_error_message(self):
        """Test that BusyResourceError contains the correct resource ID."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=True)

        paramedic = Paramedic(
            id=paramedic_id,
            name="Jane Smith",
            email="jane.smith@example.com",
            passwordHash="hashed_password_busy",
            resource=resource,
        )

        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        with pytest.raises(BusyResourceError) as exc_info:
            paramedic.assign(emergency_id)

        assert str(exc_info.value.id) == str(paramedic_id)

    def test_exceptions_preserve_paramedic_state(self):
        """Test that exceptions don't change the paramedic state."""
        paramedic_id = uuid.uuid4()
        initial_location = Location(latitude=1.0, longitude=2.0)
        resource = LocatableResource(location=initial_location, busy=True)
        emergency_id = datetime(2023, 1, 1, 12, 0, 0)

        paramedic = Paramedic(
            id=paramedic_id,
            name="Bob Johnson",
            email="bob.johnson@example.com",
            passwordHash="hashed_password_exception_preserve",
            resource=resource,
            assignedEmergencyId=None,
        )

        # Try to assign when resource is busy
        try:
            paramedic.assign(emergency_id)
        except BusyResourceError:
            pass

        # Verify state is preserved
        assert paramedic.resource.busy is True
        assert paramedic.assignedEmergencyId is None
        assert paramedic.resource.location == initial_location
