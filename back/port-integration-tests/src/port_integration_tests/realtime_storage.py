import uuid
from datetime import datetime, timedelta

import pytest
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.entities.user import Paramedic
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource


@pytest.fixture
def sample_emergency() -> Emergency:
    return Emergency(
        id=uuid.uuid4(),
        alert=Alert(
            location=Location(latitude=4.67, longitude=2.4),
            medicalInfo=None,
            generatedOn=datetime.now(),
        ),
        assignedTo=None,
        status=EmergencyStatus.RECEIVED,
        triage=None,
        timeline={EmergencyStatus.RECEIVED: datetime.now()},
    )


@pytest.fixture
def sample_emergency2() -> Emergency:
    return Emergency(
        id=uuid.uuid4(),
        alert=Alert(
            location=Location(latitude=-45.3, longitude=23.12),
            medicalInfo=None,
            generatedOn=datetime.now(),
        ),
        assignedTo=None,
        status=EmergencyStatus.TRIAGED,
        triage=None,
        timeline={
            EmergencyStatus.RECEIVED: datetime.now(),
            EmergencyStatus.TRIAGED: datetime.now() + timedelta(minutes=2),
        },
    )


@pytest.fixture
def sample_paramedic() -> Paramedic:
    return Paramedic(
        id=uuid.uuid4(),
        name="Dr. John Smith",
        email="john.smith@hospital.com",
        resource=LocatableResource(location=Location(latitude=4.67, longitude=2.4)),
        assignedEmergencyId=None,
    )


@pytest.fixture
def sample_paramedic2() -> Paramedic:
    return Paramedic(
        id=uuid.uuid4(),
        name="Dr. Sarah Johnson",
        email="sarah.johnson@hospital.com",
        resource=LocatableResource(location=Location(latitude=4.7, longitude=2.5)),
        assignedEmergencyId=None,
    )


@pytest.fixture
def sample_paramedic3() -> Paramedic:
    return Paramedic(
        id=uuid.uuid4(),
        name="Dr. Michael Brown",
        email="michael.brown@hospital.com",
        resource=LocatableResource(location=Location(latitude=5.0, longitude=2.0)),
        assignedEmergencyId=None,
    )


@pytest.mark.asyncio
async def test_consistent_saving(
    adapter: RealTimeStoragePort, sample_emergency: Emergency
):
    # 1. Arrange
    await adapter.save_emergency(sample_emergency)

    # 2. Act
    retrieved_emergency = await adapter.get_emergency(
        sample_emergency.timeline[EmergencyStatus.RECEIVED]
    )

    # 3. Assert
    assert sample_emergency == retrieved_emergency


@pytest.mark.asyncio
async def test_retrieve_multiple(
    adapter: RealTimeStoragePort,
    sample_emergency: Emergency,
    sample_emergency2: Emergency,
):
    # 1. Arrange
    await adapter.save_emergency(sample_emergency)
    await adapter.save_emergency(sample_emergency2)

    # 2. Act
    retrieved_emergency = await adapter.get_emergency(
        sample_emergency.timeline[EmergencyStatus.RECEIVED]
    )
    retrieved_emergency2 = await adapter.get_emergency(
        sample_emergency2.timeline[EmergencyStatus.RECEIVED]
    )

    # 3. Assert
    assert sample_emergency == retrieved_emergency
    assert sample_emergency2 == retrieved_emergency2
    assert retrieved_emergency != retrieved_emergency2


@pytest.mark.asyncio
async def test_save_and_get_paramedic(
    adapter: RealTimeStoragePort, sample_paramedic: Paramedic
):
    # 1. Arrange
    paramedic_id = sample_paramedic.id

    # 2. Act
    await adapter.save_paramedic(sample_paramedic)
    retrieved_paramedic = await adapter.get_paramedic(paramedic_id)

    # 3. Assert
    assert retrieved_paramedic is not None
    assert retrieved_paramedic.id == paramedic_id
    assert retrieved_paramedic.name == sample_paramedic.name
    assert retrieved_paramedic.email == sample_paramedic.email
    assert retrieved_paramedic.resource is not None
    assert retrieved_paramedic.resource.location == sample_paramedic.resource.location
    assert (
        retrieved_paramedic.assignedEmergencyId == sample_paramedic.assignedEmergencyId
    )


@pytest.mark.asyncio
async def test_get_nonexistent_paramedic(adapter: RealTimeStoragePort):
    # 1. Arrange
    nonexistent_id = uuid.uuid4()

    # 2. Act
    retrieved_paramedic = await adapter.get_paramedic(nonexistent_id)

    # 3. Assert
    assert retrieved_paramedic is None


@pytest.mark.asyncio
async def test_delete_paramedic(
    adapter: RealTimeStoragePort, sample_paramedic: Paramedic
):
    # 1. Arrange
    paramedic_id = sample_paramedic.id
    await adapter.save_paramedic(sample_paramedic)

    # 2. Act
    deleted_paramedic = await adapter.delete_paramedic(paramedic_id)
    retrieved_paramedic = await adapter.get_paramedic(paramedic_id)

    # 3. Assert
    assert deleted_paramedic is not None
    assert deleted_paramedic.id == paramedic_id
    assert retrieved_paramedic is None


@pytest.mark.asyncio
async def test_delete_nonexistent_paramedic(adapter: RealTimeStoragePort):
    # 1. Arrange
    nonexistent_id = uuid.uuid4()

    # 2. Act
    deleted_paramedic = await adapter.delete_paramedic(nonexistent_id)

    # 3. Assert
    assert deleted_paramedic is None


@pytest.mark.asyncio
async def test_get_nearby_paramedics(
    adapter: RealTimeStoragePort,
    sample_paramedic: Paramedic,
    sample_paramedic2: Paramedic,
    sample_paramedic3: Paramedic,
):
    # 1. Arrange
    target_location = Location(latitude=4.7, longitude=2.45)

    # Save paramedics with different locations
    await adapter.save_paramedic(sample_paramedic)  # Close to target
    await adapter.save_paramedic(sample_paramedic2)  # Very close to target
    await adapter.save_paramedic(sample_paramedic3)  # Far from target

    # 2. Act
    nearby_paramedics = []
    async for paramedic in adapter.get_nearby_paramedics(target_location):
        nearby_paramedics.append(paramedic)

    # 3. Assert
    assert len(nearby_paramedics) == 3

    # Check that all saved paramedics are returned
    paramedic_ids = {p.id for p in nearby_paramedics}
    expected_ids = {sample_paramedic.id, sample_paramedic2.id, sample_paramedic3.id}
    assert paramedic_ids == expected_ids


@pytest.mark.asyncio
async def test_get_nearby_paramedics_empty(adapter: RealTimeStoragePort):
    # 1. Arrange
    target_location = Location(latitude=0.0, longitude=0.0)

    # 2. Act
    nearby_paramedics = []
    async for paramedic in adapter.get_nearby_paramedics(target_location):
        nearby_paramedics.append(paramedic)

    # 3. Assert
    assert len(nearby_paramedics) == 0


@pytest.mark.asyncio
async def test_update_paramedic(
    adapter: RealTimeStoragePort, sample_paramedic: Paramedic
):
    # 1. Arrange
    paramedic_id = sample_paramedic.id
    await adapter.save_paramedic(sample_paramedic)

    # Create an updated version of the paramedic
    updated_paramedic = Paramedic(
        id=paramedic_id,
        name="Updated Name",
        email="updated.email@hospital.com",
        resource=LocatableResource(location=Location(latitude=5.0, longitude=3.0)),
        assignedEmergencyId=datetime.now(),
    )

    # 2. Act
    await adapter.save_paramedic(updated_paramedic)
    retrieved_paramedic = await adapter.get_paramedic(paramedic_id)

    # 3. Assert
    assert retrieved_paramedic is not None
    assert retrieved_paramedic.id == paramedic_id
    assert retrieved_paramedic.name == "Updated Name"
    assert retrieved_paramedic.email == "updated.email@hospital.com"
    assert retrieved_paramedic.resource is not None
    assert retrieved_paramedic.resource.location.latitude == 5.0
    assert retrieved_paramedic.resource.location.longitude == 3.0
    assert retrieved_paramedic.assignedEmergencyId is not None
