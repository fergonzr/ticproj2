import uuid
from datetime import datetime

import pytest
from core.application.ports.historical_register import HistoricalRegisterPort
from core.domain.entities.emergency import EmergencyStatus
from core.domain.entities.historical_emergency import HistoricalEmergency
from core.domain.value_objects.location import Location


@pytest.fixture
def sample_historical_emergency() -> HistoricalEmergency:
    return HistoricalEmergency(
        id=uuid.uuid4(),
        location=Location(latitude=4.5, longitude=5.6),
        filingNumber=12345,
        triage=None,
        finalStatus=EmergencyStatus.CANCELED,
        transferedTo=None,
        assignedTo=None,
        cancelReason="Annoying",
        timeline={EmergencyStatus.CANCELED: datetime.now()},
    )


@pytest.fixture
def sample_historical_emergency_in_range() -> HistoricalEmergency:
    return HistoricalEmergency(
        id=uuid.uuid4(),
        location=Location(latitude=4.5, longitude=5.6),
        filingNumber=12346,
        triage=None,
        finalStatus=EmergencyStatus.CANCELED,
        transferedTo=None,
        assignedTo=None,
        cancelReason="Annoying",
        timeline={
            EmergencyStatus.RECEIVED: datetime(2026, 4, 19, 12, 30, 12),
            EmergencyStatus.CANCELED: datetime.now(),
        },
    )


@pytest.fixture
def sample_historical_emergency_in_range2() -> HistoricalEmergency:
    return HistoricalEmergency(
        id=uuid.uuid4(),
        location=Location(latitude=4.5, longitude=5.6),
        filingNumber=12347,
        triage=None,
        finalStatus=EmergencyStatus.CANCELED,
        transferedTo=None,
        assignedTo=None,
        cancelReason="Annoying",
        timeline={
            EmergencyStatus.RECEIVED: datetime(2026, 4, 19, 12, 32, 12),
            EmergencyStatus.CANCELED: datetime.now(),
        },
    )


@pytest.fixture
def sample_historical_emergency_not_in_range() -> HistoricalEmergency:
    return HistoricalEmergency(
        id=uuid.uuid4(),
        location=Location(latitude=4.5, longitude=5.6),
        filingNumber=12348,
        triage=None,
        finalStatus=EmergencyStatus.CANCELED,
        transferedTo=None,
        assignedTo=None,
        cancelReason="Annoying",
        timeline={
            EmergencyStatus.RECEIVED: datetime(2025, 4, 19, 12, 32, 12),
            EmergencyStatus.CANCELED: datetime.now(),
        },
    )


@pytest.mark.asyncio
async def test_consistent_saving(
    adapter: HistoricalRegisterPort, sample_historical_emergency: HistoricalEmergency
):
    # 1. Arrage
    await adapter.save_emergency(sample_historical_emergency)

    # 2. Act
    retrieved_emergency = await adapter.get_emergency(sample_historical_emergency.id)

    # 3. Assert
    assert retrieved_emergency is not None
    assert sample_historical_emergency == retrieved_emergency


@pytest.mark.asyncio
async def test_date_retrieval(
    adapter: HistoricalRegisterPort,
    sample_historical_emergency_in_range: HistoricalEmergency,
    sample_historical_emergency_in_range2: HistoricalEmergency,
    sample_historical_emergency_not_in_range: HistoricalEmergency,
):
    # 1. Arrage
    await adapter.save_emergency(sample_historical_emergency_in_range)
    await adapter.save_emergency(sample_historical_emergency_in_range2)
    await adapter.save_emergency(sample_historical_emergency_not_in_range)

    # 2. Act
    retrievedEmergencies = []
    async for emergency in adapter.get_emergencies_in_daterange(
        since=datetime(2026, 1, 1)
    ):
        retrievedEmergencies.append(emergency)

    # 3. Assert
    assert sample_historical_emergency_in_range in retrievedEmergencies
    assert sample_historical_emergency_in_range2 in retrievedEmergencies
    assert sample_historical_emergency_not_in_range not in retrievedEmergencies


@pytest.mark.asyncio
async def test_date_since_to_retrieval(
    adapter: HistoricalRegisterPort,
    sample_historical_emergency_in_range: HistoricalEmergency,
    sample_historical_emergency_in_range2: HistoricalEmergency,
    sample_historical_emergency_not_in_range: HistoricalEmergency,
):
    # 1. Arrage
    await adapter.save_emergency(sample_historical_emergency_in_range)
    await adapter.save_emergency(sample_historical_emergency_in_range2)
    await adapter.save_emergency(sample_historical_emergency_not_in_range)

    # 2. Act
    retrievedEmergencies = []
    async for emergency in adapter.get_emergencies_in_daterange(
        since=datetime(2026, 1, 1),
        to=datetime(2026, 4, 19, 12, 31, 12),
    ):
        retrievedEmergencies.append(emergency)

    print(retrievedEmergencies)
    # 3. Assert
    assert sample_historical_emergency_in_range in retrievedEmergencies
    assert sample_historical_emergency_in_range2 not in retrievedEmergencies
    assert sample_historical_emergency_not_in_range not in retrievedEmergencies


@pytest.mark.asyncio
async def test_filing_number_retrieval(
    adapter: HistoricalRegisterPort, sample_historical_emergency: HistoricalEmergency
):

    # 1. Arrage
    await adapter.save_emergency(sample_historical_emergency)

    # 2. Act
    retrieved_emergency = await adapter.get_emergency_by_filing_number(
        sample_historical_emergency.filingNumber
    )

    # 3. Assert
    assert retrieved_emergency is not None
    assert sample_historical_emergency == retrieved_emergency
