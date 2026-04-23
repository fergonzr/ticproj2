"""Test module for GetNearbyMedicalCentersForEmergencyQuery use case.

This module contains tests for the GetNearbyMedicalCentersForEmergencyQuery and its handler.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from core.application.ports.medical_center_manager import MedicalCenterManagerPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases.get_nearby_medical_centers_for_emergency import (
    GetNearbyMedicalCentersForEmergencyHandler,
    GetNearbyMedicalCentersForEmergencyQuery,
    GetNearbyMedicalCentersForEmergencyQueryResult,
)
from core.domain.entities.emergency import Emergency, EmergencyNotFoundError
from core.domain.entities.medical_center import ComplexityLevel, MedicalCenter
from core.domain.value_objects.alert import Alert, NoLocationError
from core.domain.value_objects.location import Location
from core.domain.value_objects.triage import Triage

# Test data
TEST_EMERGENCY_ID = uuid.uuid4()
TEST_LOCATION = Location(latitude=6.276725346666667, longitude=-75.57992334666666)
TEST_ALERT = Alert(location=TEST_LOCATION, medicalInfo="Test medical info")
TEST_TRIAGE = Triage(medicalInfo="Test triage info")
TEST_COMPLEXITY_LEVEL = ComplexityLevel.INTERMEDIATE

# Create a test emergency
TEST_EMERGENCY = Emergency(
    id=TEST_EMERGENCY_ID,
    alert=TEST_ALERT,
    assignedTo=None,
    status="RECEIVED",
    triage=None,
    complexityLevel=TEST_COMPLEXITY_LEVEL,
    timeline={"RECEIVED": "2023-01-01T00:00:00"},
)

# Create test medical centers
TEST_MEDICAL_CENTER_1 = MedicalCenter(
    id=uuid.uuid4(),
    name="Test Medical Center 1",
    phone="123456789",
    maxComplexityLevel=ComplexityLevel.INTERMEDIATE,
    specialties=["general"],
    availableSlots=50,
    location=Location(latitude=6.276725346666667, longitude=-75.57992334666666),
)

TEST_MEDICAL_CENTER_2 = MedicalCenter(
    id=uuid.uuid4(),
    name="Test Medical Center 2",
    phone="987654321",
    maxComplexityLevel=ComplexityLevel.HIGH,
    specialties=["trauma"],
    availableSlots=100,
    location=Location(latitude=6.286725346666667, longitude=-75.58992334666666),
)


@pytest.fixture
def mock_realtime_storage():
    """Fixture for mock realtime storage port."""
    mock = AsyncMock(spec=RealTimeStoragePort)
    mock.get_emergency.return_value = TEST_EMERGENCY
    return mock


@pytest.fixture
def mock_medical_center_manager():
    """Fixture for mock medical center manager port."""
    mock = AsyncMock(spec=MedicalCenterManagerPort)
    mock.get_nearby_medical_center.return_value = [
        TEST_MEDICAL_CENTER_1,
        TEST_MEDICAL_CENTER_2,
    ]
    return mock


@pytest.fixture
def handler(mock_realtime_storage, mock_medical_center_manager):
    """Fixture for the handler with mocked dependencies."""
    return GetNearbyMedicalCentersForEmergencyHandler(
        realtimeStorage=mock_realtime_storage,
        medicalCenterManager=mock_medical_center_manager,
    )


@pytest.mark.asyncio
async def test_successful_query(
    handler, mock_realtime_storage, mock_medical_center_manager
):
    """Test successful execution of the query."""
    query = GetNearbyMedicalCentersForEmergencyQuery(emergencyId=TEST_EMERGENCY_ID)

    result = await handler.handle(query)

    # Verify the emergency was retrieved
    mock_realtime_storage.get_emergency.assert_awaited_once_with(TEST_EMERGENCY_ID)

    # Verify medical centers were retrieved with correct parameters
    mock_medical_center_manager.get_nearby_medical_center.assert_awaited_once_with(
        TEST_LOCATION, TEST_COMPLEXITY_LEVEL
    )

    # Verify the result
    assert isinstance(result, GetNearbyMedicalCentersForEmergencyQueryResult)
    assert len(result.medicalCenters) == 2
    assert result.medicalCenters[0] == TEST_MEDICAL_CENTER_1
    assert result.medicalCenters[1] == TEST_MEDICAL_CENTER_2


@pytest.mark.asyncio
async def test_emergency_not_found(
    handler, mock_realtime_storage, mock_medical_center_manager
):
    """Test query when emergency is not found."""
    mock_realtime_storage.get_emergency.return_value = None
    query = GetNearbyMedicalCentersForEmergencyQuery(emergencyId=TEST_EMERGENCY_ID)

    with pytest.raises(EmergencyNotFoundError):
        await handler.handle(query)

    # Verify no call was made to medical center manager
    mock_medical_center_manager.get_nearby_medical_center.assert_not_awaited()


@pytest.mark.asyncio
async def test_no_location_error(
    handler, mock_realtime_storage, mock_medical_center_manager
):
    """Test query when emergency has no location."""
    emergency_without_location = Emergency(
        id=TEST_EMERGENCY_ID,
        alert=Alert(location=None, medicalInfo="Test medical info"),  # No location
        assignedTo=None,
        status="RECEIVED",
        triage=None,
        complexityLevel=TEST_COMPLEXITY_LEVEL,
        timeline={"RECEIVED": "2023-01-01T00:00:00"},
    )
    mock_realtime_storage.get_emergency.return_value = emergency_without_location
    query = GetNearbyMedicalCentersForEmergencyQuery(emergencyId=TEST_EMERGENCY_ID)

    with pytest.raises(NoLocationError):
        await handler.handle(query)

    # Verify no call was made to medical center manager
    mock_medical_center_manager.get_nearby_medical_center.assert_not_awaited()


@pytest.mark.asyncio
async def test_no_complexity_level_error(
    handler, mock_realtime_storage, mock_medical_center_manager
):
    """Test query when emergency has no complexity level."""
    emergency_without_complexity = Emergency(
        id=TEST_EMERGENCY_ID,
        alert=TEST_ALERT,
        assignedTo=None,
        status="RECEIVED",
        triage=None,
        complexityLevel=None,  # No complexity level
        timeline={"RECEIVED": "2023-01-01T00:00:00"},
    )
    mock_realtime_storage.get_emergency.return_value = emergency_without_complexity
    query = GetNearbyMedicalCentersForEmergencyQuery(emergencyId=TEST_EMERGENCY_ID)

    with pytest.raises(ValueError, match="Emergency has no complexity level assigned"):
        await handler.handle(query)

    # Verify no call was made to medical center manager
    mock_medical_center_manager.get_nearby_medical_center.assert_not_awaited()
