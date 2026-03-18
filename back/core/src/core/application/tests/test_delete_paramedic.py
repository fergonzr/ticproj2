"""Tests for the DeleteParamedicFromRTDb use case.

This module contains integration tests for the DeleteParamedicFromRTDbHandler
which removes paramedics from the real-time storage database.

The use case is responsible for:
1. Deleting a paramedic from real-time storage by their ID
2. Handling the case where the paramedic doesn't exist (UserNotFoundError)
3. Ensuring the paramedic is properly removed from the active pool
"""

import uuid

import pytest

from core.application.use_cases.delete_paramedic import (
    DeleteParamedicFromRTDbCommand,
    DeleteParamedicFromRTDbHandler,
)
from core.domain.entities.user import Paramedic, UserNotFoundError, UserRole
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource

from .mock_adapters import MockRealTimeStoragePort, mock_realtime_storage


@pytest.fixture
def paramedic() -> Paramedic:
    """Fixture providing a sample paramedic for testing."""
    return Paramedic(
        id=uuid.uuid4(),
        name="Dr. John Smith",
        email="john.smith@hospital.com",
        passwordHash="hashed_password_123",
        userRole=UserRole.PARAMEDIC,
        resource=LocatableResource(location=Location(latitude=4.67, longitude=2.4)),
        assignedEmergencyId=None,
    )


@pytest.fixture
def delete_paramedic_handler(
    mock_realtime_storage: MockRealTimeStoragePort,
) -> DeleteParamedicFromRTDbHandler:
    """Fixture providing a DeleteParamedicFromRTDbHandler with mock dependencies."""
    return DeleteParamedicFromRTDbHandler(mock_realtime_storage)


@pytest.mark.asyncio
async def test_delete_paramedic_success(
    delete_paramedic_handler: DeleteParamedicFromRTDbHandler,
    paramedic: Paramedic,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test successful deletion of a paramedic."""
    # Arrange
    paramedic_id = paramedic.id
    # Save the paramedic first so it can be deleted
    await mock_realtime_storage.save_paramedic(paramedic)

    command = DeleteParamedicFromRTDbCommand(paramedicId=paramedic_id)

    # Act
    await delete_paramedic_handler.handle(command)

    # Assert
    # Verify the paramedic was deleted from storage
    retrieved_paramedic = await mock_realtime_storage.get_paramedic(paramedic_id)
    assert retrieved_paramedic is None

    # Verify the delete operation was recorded
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 2  # One save, one delete
    assert paramedic_calls[1][0] == "delete_paramedic"
    assert paramedic_calls[1][1].id == paramedic_id


@pytest.mark.asyncio
async def test_delete_nonexistent_paramedic(
    delete_paramedic_handler: DeleteParamedicFromRTDbHandler,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test deletion of a paramedic that doesn't exist."""
    # Arrange
    nonexistent_id = uuid.uuid4()
    command = DeleteParamedicFromRTDbCommand(paramedicId=nonexistent_id)

    # Act & Assert
    with pytest.raises(UserNotFoundError):
        await delete_paramedic_handler.handle(command)

    # Verify no delete calls were made
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 0


@pytest.mark.asyncio
async def test_delete_paramedic_idempotent(
    delete_paramedic_handler: DeleteParamedicFromRTDbHandler,
    paramedic: Paramedic,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test that deleting the same paramedic multiple times is idempotent.

    This test verifies that the use case correctly handles multiple deletion
    attempts of the same paramedic.
    """
    # Arrange
    paramedic_id = paramedic.id
    # Save the paramedic first
    await mock_realtime_storage.save_paramedic(paramedic)

    command = DeleteParamedicFromRTDbCommand(paramedicId=paramedic_id)

    # Act - delete twice
    await delete_paramedic_handler.handle(command)

    # First deletion should succeed
    with pytest.raises(UserNotFoundError):
        await delete_paramedic_handler.handle(command)

    # Second deletion should fail with UserNotFoundError

    # Assert
    # Verify the paramedic was deleted (only once)
    retrieved_paramedic = await mock_realtime_storage.get_paramedic(paramedic_id)
    assert retrieved_paramedic is None

    # Verify only one delete call was made
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    delete_calls = [call for call in paramedic_calls if call[0] == "delete_paramedic"]
    assert len(delete_calls) == 1


@pytest.mark.asyncio
async def test_delete_paramedic_with_different_paramedics(
    delete_paramedic_handler: DeleteParamedicFromRTDbHandler,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test deletion of different paramedics in sequence."""
    # Arrange
    # Create two paramedics
    paramedic_id1 = uuid.uuid4()
    paramedic1 = Paramedic(
        id=paramedic_id1,
        name="Dr. First Paramedic",
        email="first@hospital.com",
        passwordHash="hashed_password_first",
        userRole=UserRole.PARAMEDIC,
        resource=LocatableResource(location=Location(latitude=1.0, longitude=2.0)),
        assignedEmergencyId=None,
    )

    paramedic_id2 = uuid.uuid4()
    paramedic2 = Paramedic(
        id=paramedic_id2,
        name="Dr. Second Paramedic",
        email="second@hospital.com",
        passwordHash="hashed_password_second",
        userRole=UserRole.PARAMEDIC,
        resource=LocatableResource(location=Location(latitude=3.0, longitude=4.0)),
        assignedEmergencyId=None,
    )

    # Save both paramedics
    await mock_realtime_storage.save_paramedic(paramedic1)
    await mock_realtime_storage.save_paramedic(paramedic2)

    # Act - delete both paramedics
    command1 = DeleteParamedicFromRTDbCommand(paramedicId=paramedic_id1)
    command2 = DeleteParamedicFromRTDbCommand(paramedicId=paramedic_id2)

    await delete_paramedic_handler.handle(command1)
    await delete_paramedic_handler.handle(command2)

    # Assert
    # Verify both paramedics were deleted
    retrieved_paramedic1 = await mock_realtime_storage.get_paramedic(paramedic_id1)
    retrieved_paramedic2 = await mock_realtime_storage.get_paramedic(paramedic_id2)

    assert retrieved_paramedic1 is None
    assert retrieved_paramedic2 is None

    # Verify both delete calls were recorded
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    delete_calls = [call for call in paramedic_calls if call[0] == "delete_paramedic"]
    assert len(delete_calls) == 2

    # Verify the correct paramedics were deleted
    deleted_ids = [call[1].id for call in delete_calls]
    assert paramedic_id1 in deleted_ids
    assert paramedic_id2 in deleted_ids


@pytest.mark.asyncio
async def test_delete_paramedic_preserves_other_paramedics(
    delete_paramedic_handler: DeleteParamedicFromRTDbHandler,
    paramedic: Paramedic,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test that deleting one paramedic doesn't affect other paramedics."""
    # Arrange
    # Create a second paramedic
    paramedic_id2 = uuid.uuid4()
    paramedic2 = Paramedic(
        id=paramedic_id2,
        name="Dr. Other Paramedic",
        email="other@hospital.com",
        passwordHash="hashed_password_other",
        userRole=UserRole.PARAMEDIC,
        resource=LocatableResource(location=Location(latitude=5.0, longitude=6.0)),
        assignedEmergencyId=None,
    )

    # Save both paramedics
    await mock_realtime_storage.save_paramedic(paramedic)
    await mock_realtime_storage.save_paramedic(paramedic2)

    # Act - delete only the first paramedic
    command = DeleteParamedicFromRTDbCommand(paramedicId=paramedic.id)
    await delete_paramedic_handler.handle(command)

    # Assert
    # Verify the first paramedic was deleted
    retrieved_paramedic1 = await mock_realtime_storage.get_paramedic(paramedic.id)
    assert retrieved_paramedic1 is None

    # Verify the second paramedic still exists
    retrieved_paramedic2 = await mock_realtime_storage.get_paramedic(paramedic_id2)
    assert retrieved_paramedic2 is not None
    assert retrieved_paramedic2.id == paramedic_id2
    assert retrieved_paramedic2.name == "Dr. Other Paramedic"
