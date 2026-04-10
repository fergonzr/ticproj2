"""Test module for CloseEmergencyCommand use case.

This module contains tests for the CloseEmergencyCommand and its handler.
"""

import uuid
from unittest.mock import AsyncMock

import pytest

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases.close_emergency import (
    CloseEmergencyCommand,
    CloseEmergencyHandler,
)
from core.domain.entities.emergency import (
    Emergency,
    EmergencyNotFoundError,
    InvalidEmergencyStateTransitionException,
)
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

# Create an emergency in SOLVED status (valid for closing)
TEST_EMERGENCY_SOLVED = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=TEST_PARAMEDIC,
    status="SOLVED",
    triage=None,
    complexityLevel=None,
    transferedTo=None,
    timeline={
        "RECEIVED": "2023-01-01T00:00:00",
        "TRIAGED": "2023-01-01T00:01:00",
        "ASSIGNED": "2023-01-01T00:02:00",
        "ON_SITE": "2023-01-01T00:03:00",
        "SOLVED": "2023-01-01T00:04:00",
    },
)

# Create an emergency in wrong status (not SOLVED)
TEST_EMERGENCY_WRONG_STATUS = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=TEST_PARAMEDIC,
    status="ON_SITE",  # Not SOLVED
    triage=None,
    complexityLevel=None,
    transferedTo=None,
    timeline={
        "RECEIVED": "2023-01-01T00:00:00",
        "TRIAGED": "2023-01-01T00:01:00",
        "ASSIGNED": "2023-01-01T00:02:00",
        "ON_SITE": "2023-01-01T00:03:00",
    },
)


@pytest.fixture
def mock_coordinator():
    """Fixture for mock coordinator port."""
    mock = AsyncMock(spec=CoordinatorPort)
    mock.report_closing = AsyncMock()  # Add the new method
    return mock


@pytest.fixture
def mock_storage():
    """Fixture for mock realtime storage port."""
    mock = AsyncMock(spec=RealTimeStoragePort)
    mock.get_emergency.return_value = TEST_EMERGENCY_SOLVED
    return mock


@pytest.fixture
def handler(mock_coordinator, mock_storage):
    """Fixture for the handler with mocked dependencies."""
    return CloseEmergencyHandler(
        coordinator=mock_coordinator,
        storage=mock_storage,
    )


@pytest.mark.asyncio
async def test_successful_closing(handler, mock_storage, mock_coordinator):
    """Test successful closing of emergency."""
    command = CloseEmergencyCommand(emergencyId=TEST_EMERGENCY_ID)

    await handler.handle(command)

    # Verify emergency was retrieved
    mock_storage.get_emergency.assert_awaited_once_with(TEST_EMERGENCY_ID)

    # Verify emergency was saved with CLOSED status
    mock_storage.save_emergency.assert_awaited_once()
    saved_emergency = mock_storage.save_emergency.call_args[0][0]
    assert saved_emergency.status.name == "CLOSED"

    # Verify closing was reported to coordinator
    mock_coordinator.report_closing.assert_awaited_once_with(saved_emergency)


@pytest.mark.asyncio
async def test_emergency_not_found(handler, mock_storage, mock_coordinator):
    """Test command when emergency is not found."""
    mock_storage.get_emergency.return_value = None
    command = CloseEmergencyCommand(emergencyId=TEST_EMERGENCY_ID)

    with pytest.raises(EmergencyNotFoundError):
        await handler.handle(command)

    # Verify no save or reporting was attempted
    mock_storage.save_emergency.assert_not_awaited()
    mock_coordinator.report_closing.assert_not_awaited()


@pytest.mark.asyncio
async def test_invalid_emergency_state(handler, mock_storage, mock_coordinator):
    """Test command when emergency is in invalid state."""
    mock_storage.get_emergency.return_value = TEST_EMERGENCY_WRONG_STATUS
    command = CloseEmergencyCommand(emergencyId=TEST_EMERGENCY_ID)

    with pytest.raises(InvalidEmergencyStateTransitionException):
        await handler.handle(command)

    # Verify no save or reporting was attempted
    mock_storage.save_emergency.assert_not_awaited()
    mock_coordinator.report_closing.assert_not_awaited()
