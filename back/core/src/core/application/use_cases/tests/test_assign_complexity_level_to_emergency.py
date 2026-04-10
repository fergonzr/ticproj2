"""Test module for AssignComplexityLevelToEmergencyCommand use case.

This module contains tests for the AssignComplexityLevelToEmergencyCommand and its handler.
"""

import uuid
from unittest.mock import AsyncMock

import pytest

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases.assign_complexity_level_to_emergency import (
    AssignComplexityLevelToEmergencyCommand,
    AssignComplexityLevelToEmergencyHandler,
)
from core.domain.entities.emergency import (
    Emergency,
    EmergencyNotFoundError,
    InvalidEmergencyStateTransitionException,
)
from core.domain.entities.medical_center import ComplexityLevel
from core.domain.entities.user import Paramedic
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location

# Test data
TEST_EMERGENCY_ID = uuid.uuid4()
TEST_LOCATION = Location(latitude=6.276725346666667, longitude=-75.57992334666666)
TEST_ALERT = Alert(location=TEST_LOCATION, medicalInfo="Test medical info")
TEST_PARAMEDIC = Paramedic(
    id=uuid.uuid4(),
    name="Test Paramedic",
    email="test@example.com",
    passwordHash="hash",
    userRole="PARAMEDIC",
    resource=None,
    assignedEmergencyId=None,
)

# Create an emergency in ON_SITE status (required for complexity level assignment)
TEST_EMERGENCY_ON_SITE = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=TEST_PARAMEDIC,
    status="ON_SITE",
    triage=None,
    complexityLevel=None,
    timeline={
        "RECEIVED": "2023-01-01T00:00:00",
        "TRIAGED": "2023-01-01T00:01:00",
        "ASSIGNED": "2023-01-01T00:02:00",
        "ON_SITE": "2023-01-01T00:03:00",
    },
)

# Create an emergency in wrong status (ASSIGNED - not ON_SITE)
TEST_EMERGENCY_WRONG_STATUS = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=TEST_PARAMEDIC,
    status="ASSIGNED",
    triage=None,
    complexityLevel=None,
    timeline={
        "RECEIVED": "2023-01-01T00:00:00",
        "TRIAGED": "2023-01-01T00:01:00",
        "ASSIGNED": "2023-01-01T00:02:00",
    },
)


@pytest.fixture
def mock_coordinator():
    """Fixture for mock coordinator port."""
    mock = AsyncMock(spec=CoordinatorPort)
    return mock


@pytest.fixture
def mock_storage():
    """Fixture for mock realtime storage port."""
    mock = AsyncMock(spec=RealTimeStoragePort)
    mock.get_emergency.return_value = TEST_EMERGENCY_ON_SITE
    return mock


@pytest.fixture
def handler(mock_coordinator, mock_storage):
    """Fixture for the handler with mocked dependencies."""
    return AssignComplexityLevelToEmergencyHandler(
        coordinator=mock_coordinator,
        storage=mock_storage,
    )


@pytest.mark.asyncio
async def test_successful_complexity_assignment(handler, mock_storage):
    """Test successful assignment of complexity level."""
    command = AssignComplexityLevelToEmergencyCommand(
        emergencyId=TEST_EMERGENCY_ID, complexityLevel=ComplexityLevel.INTERMEDIATE
    )

    await handler.handle(command)

    # Verify emergency was retrieved
    mock_storage.get_emergency.assert_awaited_once_with(TEST_EMERGENCY_ID)

    # Verify emergency was saved with the new complexity level
    mock_storage.save_emergency.assert_awaited_once()
    saved_emergency = mock_storage.save_emergency.call_args[0][0]
    assert saved_emergency.complexityLevel == ComplexityLevel.INTERMEDIATE

    # Verify complexity assignment was reported to coordinator
    mock_coordinator.report_complexity_assignment.assert_awaited_once_with(
        saved_emergency
    )


@pytest.mark.asyncio
async def test_emergency_not_found(handler, mock_storage):
    """Test command when emergency is not found."""
    mock_storage.get_emergency.return_value = None
    command = AssignComplexityLevelToEmergencyCommand(
        emergencyId=TEST_EMERGENCY_ID, complexityLevel=ComplexityLevel.HIGH
    )

    with pytest.raises(EmergencyNotFoundError):
        await handler.handle(command)

    # Verify no save was attempted
    mock_storage.save_emergency.assert_not_awaited()
    # Verify no coordinator reporting was attempted
    mock_coordinator.report_complexity_assignment.assert_not_awaited()
    # Verify no coordinator reporting was attempted
    mock_coordinator.report_complexity_assignment.assert_not_awaited()


@pytest.mark.asyncio
async def test_invalid_emergency_state(handler, mock_storage):
    """Test command when emergency is in invalid state."""
    mock_storage.get_emergency.return_value = TEST_EMERGENCY_WRONG_STATUS
    command = AssignComplexityLevelToEmergencyCommand(
        emergencyId=TEST_EMERGENCY_ID, complexityLevel=ComplexityLevel.BASIC
    )

    with pytest.raises(InvalidEmergencyStateTransitionException):
        await handler.handle(command)

    # Verify no save was attempted
    mock_storage.save_emergency.assert_not_awaited()


@pytest.mark.asyncio
async def test_different_complexity_levels(handler, mock_storage):
    """Test assignment of different complexity levels."""
    complexity_levels = [
        ComplexityLevel.BASIC,
        ComplexityLevel.INTERMEDIATE,
        ComplexityLevel.HIGH,
    ]

    for level in complexity_levels:
        # Reset the mock
        mock_storage.reset_mock()
        mock_storage.get_emergency.return_value = TEST_EMERGENCY_ON_SITE

        command = AssignComplexityLevelToEmergencyCommand(
            emergencyId=TEST_EMERGENCY_ID, complexityLevel=level
        )

        await handler.handle(command)

        # Verify the correct complexity level was assigned
        saved_emergency = mock_storage.save_emergency.call_args[0][0]
        assert saved_emergency.complexityLevel == level

        # Verify complexity assignment was reported to coordinator
        mock_coordinator.report_complexity_assignment.assert_awaited_once_with(
            saved_emergency
        )
