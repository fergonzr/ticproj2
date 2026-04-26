```py /home/fer/Documents/upb/2026_1/ticproj2/ticproj2/back/core/src/core/application/use_cases/tests/test_transfer_emergency_to_medical_center.py#L1-200
"""Test module for TransferEmergencyToMedicalCenterCommand use case.

This module contains tests for the TransferEmergencyToMedicalCenterCommand and its handler.
"""

import uuid
from unittest.mock import AsyncMock

import pytest
from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.medical_center_manager import MedicalCenterManagerPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases.transfer_emergency_to_medical_center import (
    TransferEmergencyToMedicalCenterCommand,
    TransferEmergencyToMedicalCenterHandler,
)
from core.domain.entities.emergency import (
    Emergency,
    EmergencyNotFoundError,
    InvalidEmergencyStateTransitionException,
)
from core.domain.entities.medical_center import ComplexityLevel, MedicalCenter
from core.domain.entities.user import Paramedic
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location

# Test data
TEST_EMERGENCY_ID = uuid.uuid4()
TEST_MEDICAL_CENTER_ID = uuid.uuid4()
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

# Create an emergency in ON_SITE status with complexity level (required for transfer)
TEST_EMERGENCY_ON_SITE = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=TEST_PARAMEDIC,
    status="ON_SITE",
    triage=None,
    complexityLevel=ComplexityLevel.INTERMEDIATE,
    transferedTo=None,
    timeline={
        "RECEIVED": "2023-01-01T00:00:00",
        "TRIAGED": "2023-01-01T00:01:00",
        "ASSIGNED": "2023-01-01T00:02:00",
        "ON_SITE": "2023-01-01T00:03:00",
    },
)

# Create a medical center that can handle the emergency's complexity level
TEST_MEDICAL_CENTER = MedicalCenter(
    id=TEST_MEDICAL_CENTER_ID,
    name="Test Medical Center",
    phone="123456789",
    maxComplexityLevel=ComplexityLevel.INTERMEDIATE,
    specialties=["general"],
    availableSlots=50,
    location=Location(latitude=6.276725346666667, longitude=-75.57992334666666),
)

# Create a medical center that CANNOT handle the emergency's complexity level
TEST_MEDICAL_CENTER_INSUFFICIENT = MedicalCenter(
    id=uuid.uuid4(),
    name="Insufficient Medical Center",
    phone="987654321",
    maxComplexityLevel=ComplexityLevel.BASIC,  # Too low for INTERMEDIATE emergency
    specialties=["basic"],
    availableSlots=10,
    location=Location(latitude=6.286725346666667, longitude=-75.58992334666666),
)

# Create an emergency in wrong status (not ON_SITE)
TEST_EMERGENCY_WRONG_STATUS = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=TEST_PARAMEDIC,
    status="ASSIGNED",  # Not ON_SITE
    triage=None,
    complexityLevel=ComplexityLevel.INTERMEDIATE,
    transferedTo=None,
    timeline={
        "RECEIVED": "2023-01-01T00:00:00",
        "TRIAGED": "2023-01-01T00:01:00",
        "ASSIGNED": "2023-01-01T00:02:00",
    },
)

# Create an emergency without complexity level
TEST_EMERGENCY_NO_COMPLEXITY = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=TEST_PARAMEDIC,
    status="ON_SITE",
    triage=None,
    complexityLevel=None,  # No complexity level
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
    mock.report_transfer = AsyncMock()  # Add the new method
    return mock

@pytest.fixture
def mock_storage():
    """Fixture for mock realtime storage port."""
    mock = AsyncMock(spec=RealTimeStoragePort)
    mock.get_emergency.return_value = TEST_EMERGENCY_ON_SITE
    return mock

@pytest.fixture
def mock_medical_center_manager():
    """Fixture for mock medical center manager port."""
    mock = AsyncMock(spec=MedicalCenterManagerPort)
    mock.get_medical_center_by_id.return_value = TEST_MEDICAL_CENTER
    return mock

@pytest.fixture
def handler(mock_coordinator, mock_storage, mock_medical_center_manager):
    """Fixture for the handler with mocked dependencies."""
    return TransferEmergencyToMedicalCenterHandler(
        coordinator=mock_coordinator,
        storage=mock_storage,
        medicalCenterManager=mock_medical_center_manager,
    )

@pytest.mark.asyncio
async def test_successful_transfer(handler, mock_storage, mock_medical_center_manager, mock_coordinator):
    """Test successful transfer of emergency to medical center."""
    command = TransferEmergencyToMedicalCenterCommand(
        emergencyId=TEST_EMERGENCY_ID,
        medicalCenterId=TEST_MEDICAL_CENTER_ID,
    )

    await handler.handle(command)

    # Verify emergency was retrieved
    mock_storage.get_emergency.assert_awaited_once_with(TEST_EMERGENCY_ID)

    # Verify medical center was retrieved
    mock_medical_center_manager.get_medical_center_by_id.assert_awaited_once_with(TEST_MEDICAL_CENTER_ID)

    # Verify emergency was saved with transfer information
    mock_storage.save_emergency.assert_awaited_once()
    saved_emergency = mock_storage.save_emergency.call_args[0][0]
    assert saved_emergency.transferedTo == TEST_MEDICAL_CENTER
    assert saved_emergency.status.name == "IN_TRANSFER"

    # Verify transfer was reported to coordinator
    mock_coordinator.report_transfer.assert_awaited_once_with(saved_emergency)

@pytest.mark.asyncio
async def test_emergency_not_found(handler, mock_storage, mock_medical_center_manager, mock_coordinator):
    """Test command when emergency is not found."""
    mock_storage.get_emergency.return_value = None
    command = TransferEmergencyToMedicalCenterCommand(
        emergencyId=TEST_EMERGENCY_ID,
        medicalCenterId=TEST_MEDICAL_CENTER_ID,
    )

    with pytest.raises(EmergencyNotFoundError):
        await handler.handle(command)

    # Verify no other operations were attempted
    mock_medical_center_manager.get_medical_center_by_id.assert_not_awaited()
    mock_storage.save_emergency.assert_not_awaited()
    mock_coordinator.report_transfer.assert_not_awaited()

@pytest.mark.asyncio
async def test_medical_center_not_found(handler, mock_storage, mock_medical_center_manager, mock_coordinator):
    """Test command when medical center is not found."""
    mock_medical_center_manager.get_medical_center_by_id.return_value = None
    command = TransferEmergencyToMedicalCenterCommand(
        emergencyId=TEST_EMERGENCY_ID,
        medicalCenterId=TEST_MEDICAL_CENTER_ID,
    )

    with pytest.raises(ValueError, match="Medical center with id .* not found"):
        await handler.handle(command)

    # Verify no save or reporting was attempted
    mock_storage.save_emergency.assert_not_awaited()
    mock_coordinator.report_transfer.assert_not_awaited()

@pytest.mark.asyncio
async def test_invalid_emergency_state(handler, mock_storage, mock_medical_center_manager, mock_coordinator):
    """Test command when emergency is in invalid state."""
    mock_storage.get_emergency.return_value = TEST_EMERGENCY_WRONG_STATUS
    command = TransferEmergencyToMedicalCenterCommand(
        emergencyId=TEST_EMERGENCY_ID,
        medicalCenterId=TEST_MEDICAL_CENTER_ID,
    )

    with pytest.raises(InvalidEmergencyStateTransitionException):
        await handler.handle(command)

    # Verify no save or reporting was attempted
    mock_storage.save_emergency.assert_not_awaited()
    mock_coordinator.report_transfer.assert_not_awaited()

@pytest.mark.asyncio
async def test_no_complexity_level(handler, mock_storage, mock_medical_center_manager, mock_coordinator):
    """Test command when emergency has no complexity level."""
    mock_storage.get_emergency.return_value = TEST_EMERGENCY_NO_COMPLEXITY
    command = TransferEmergencyToMedicalCenterCommand(
        emergencyId=TEST_EMERGENCY_ID,
        medicalCenterId=TEST_MEDICAL_CENTER_ID,
    )

    with pytest.raises(ValueError, match="Emergency has no complexity level assigned"):
        await handler.handle(command)

    # Verify no save or reporting was attempted
    mock_storage.save_emergency.assert_not_awaited()
    mock_coordinator.report_transfer.assert_not_awaited()

@pytest.mark.asyncio
async def test_insufficient_medical_center_capability(handler, mock_storage, mock_medical_center_manager, mock_coordinator):
    """Test command when medical center cannot handle emergency complexity."""
    mock_medical_center_manager.get_medical_center_by_id.return_value = TEST_MEDICAL_CENTER_INSUFFICIENT
    command = TransferEmergencyToMedicalCenterCommand(
        emergencyId=TEST_EMERGENCY_ID,
        medicalCenterId=TEST_MEDICAL_CENTER_INSUFFICIENT.id,
    )

    with pytest.raises(ValueError, match="Medical center .* cannot handle complexity level"):
        await handler.handle(command)

    # Verify no save or reporting was attempted
    mock_storage.save_emergency.assert_not_awaited()
    mock_coordinator.report_transfer.assert_not_awaited()

@pytest.mark.asyncio
async def test_different_complexity_levels(handler, mock_storage, mock_medical_center_manager, mock_coordinator):
    """Test transfer with different complexity levels."""
    complexity_levels = [ComplexityLevel.BASIC, ComplexityLevel.INTERMEDIATE, ComplexityLevel.HIGH]

    for level in complexity_levels:
        # Reset mocks and set up emergency with current complexity level
        mock_storage.reset_mock()
        mock_medical_center_manager.reset_mock()
        mock_coordinator.reset_mock()

        emergency_with_level = Emergency(
            id=TEST_EMERGENCY_ID,
            alert=TEST_ALERT,
            assignedTo=TEST_PARAMEDIC,
            status="ON_SITE",
            triage=None,
            complexityLevel=level,
            transferedTo=None,
            timeline={
                "RECEIVED": "2023-01-01T00:00:00",
                "TRIAGED": "2023-01-01T00:01:00",
                "ASSIGNED": "2023-01-01T00:02:00",
                "ON_SITE": "2023-01-01T00:03:00",
            },
        )

        medical_center_with_capability = MedicalCenter(
            id=TEST_MEDICAL_CENTER_ID,
            name="Test Medical Center",
            phone="123456789",
            maxComplexityLevel=level,  # Medical center can handle this level
            specialties=["general"],
            availableSlots=50,
            location=Location(latitude=6.276725346666667, longitude=-75.57992334666666),
        )

        mock_storage.get_emergency.return_value = emergency_with_level
        mock_medical_center_manager.get_medical_center_by_id.return_value = medical_center_with_capability

        command = TransferEmergencyToMedicalCenterCommand(
            emergencyId=TEST_EMERGENCY_ID,
            medicalCenterId=TEST_MEDICAL_CENTER_ID,
        )

        await handler.handle(command)

        # Verify the transfer was successful
        saved_emergency = mock_storage.save_emergency.call_args[0][0]
        assert saved_emergency.transferedTo == medical_center_with_capability
        assert saved_emergency.status.name == "IN_TRANSFER"

        # Verify transfer was reported
        mock_coordinator.report_transfer.assert_awaited_once_with(saved_emergency)
