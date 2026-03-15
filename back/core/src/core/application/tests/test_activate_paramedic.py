"""Tests for the ActivateParamedic use case.

This module contains integration tests for the ActivateParamedicHandler
which activates paramedics in the real-time storage database.
"""

import uuid
from datetime import datetime

import pytest

from core.application.use_cases.activate_paramedic import (
    ActivateParamedicCommand,
    ActivateParamedicHandler,
)
from core.domain.entities.user import Paramedic, User, UserNotFoundError
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource

from .mock_adapters import (
    MockRealTimeStoragePort,
    MockUserManagerPort,
    mock_realtime_storage,
    mock_user_manager,
)


@pytest.fixture
def paramedic() -> Paramedic:
    """Fixture providing a sample paramedic for testing."""
    return Paramedic(
        id=uuid.uuid4(),
        name="Dr. John Smith",
        email="john.smith@hospital.com",
        resource=LocatableResource(location=Location(latitude=4.67, longitude=2.4)),
        assignedEmergencyId=None,
    )


@pytest.fixture
def non_paramedic_user() -> User:
    """Fixture providing a non-paramedic user for testing error cases."""
    return User(
        id=uuid.uuid4(),
        name="Regular User",
        email="user@example.com",
    )


@pytest.fixture
def activate_paramedic_handler(
    mock_realtime_storage: MockRealTimeStoragePort,
    mock_user_manager: MockUserManagerPort,
) -> ActivateParamedicHandler:
    """Fixture providing an ActivateParamedicHandler with mock dependencies."""
    return ActivateParamedicHandler(mock_realtime_storage, mock_user_manager)


@pytest.mark.asyncio
async def test_activate_paramedic_success(
    activate_paramedic_handler: ActivateParamedicHandler,
    paramedic: Paramedic,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test successful activation of a paramedic."""
    # Arrange
    paramedic_id = paramedic.id
    mock_user_manager.add_user(paramedic)

    command = ActivateParamedicCommand(paramedicId=paramedic_id)

    # Act
    await activate_paramedic_handler.handle(command)

    # Assert
    # Verify user manager was called correctly
    user_calls = mock_user_manager.get_get_user_calls()
    assert len(user_calls) == 1
    assert user_calls[0] == paramedic_id

    # Verify paramedic was saved to real-time storage
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 1
    assert paramedic_calls[0][0] == "save_paramedic"
    assert paramedic_calls[0][1].id == paramedic_id
    assert paramedic_calls[0][1].name == paramedic.name

    # Verify the paramedic can be retrieved from storage
    retrieved_paramedic = await mock_realtime_storage.get_paramedic(paramedic_id)
    assert retrieved_paramedic is not None
    assert retrieved_paramedic.id == paramedic_id
    assert retrieved_paramedic.name == paramedic.name
    assert retrieved_paramedic.email == paramedic.email
    assert retrieved_paramedic.resource is not None
    assert retrieved_paramedic.resource.location == paramedic.resource.location


@pytest.mark.asyncio
async def test_activate_nonexistent_paramedic(
    activate_paramedic_handler: ActivateParamedicHandler,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test activation of a paramedic that doesn't exist."""
    # Arrange
    nonexistent_id = uuid.uuid4()
    command = ActivateParamedicCommand(paramedicId=nonexistent_id)

    # Act & Assert
    with pytest.raises(UserNotFoundError):
        await activate_paramedic_handler.handle(command)

    # Verify no calls were made to real-time storage
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 0


@pytest.mark.asyncio
async def test_activate_non_paramedic_user(
    activate_paramedic_handler: ActivateParamedicHandler,
    non_paramedic_user: User,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test activation of a user that is not a paramedic."""
    # Arrange
    user_id = non_paramedic_user.id
    mock_user_manager.add_user(non_paramedic_user)

    command = ActivateParamedicCommand(paramedicId=user_id)

    # Act & Assert
    with pytest.raises(UserNotFoundError):
        await activate_paramedic_handler.handle(command)

    # Verify no calls were made to real-time storage
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 0


@pytest.mark.asyncio
async def test_activate_paramedic_with_assignment(
    activate_paramedic_handler: ActivateParamedicHandler,
    paramedic: Paramedic,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test activation of a paramedic that already has an assignment."""
    # Arrange
    paramedic_id = paramedic.id
    # Create a paramedic with an existing assignment
    paramedic_with_assignment = Paramedic(
        id=paramedic_id,
        name="Dr. Assigned Paramedic",
        email="assigned@hospital.com",
        resource=LocatableResource(
            location=Location(latitude=5.0, longitude=3.0), busy=True
        ),
        assignedEmergencyId=datetime.now(),
    )
    mock_user_manager.add_user(paramedic_with_assignment)

    command = ActivateParamedicCommand(paramedicId=paramedic_id)

    # Act
    await activate_paramedic_handler.handle(command)

    # Assert
    # Verify the paramedic with assignment was saved correctly
    retrieved_paramedic = await mock_realtime_storage.get_paramedic(paramedic_id)
    assert retrieved_paramedic is not None
    assert retrieved_paramedic.id == paramedic_id
    assert retrieved_paramedic.assignedEmergencyId is not None
    assert retrieved_paramedic.resource is not None
    assert retrieved_paramedic.resource.busy is True


@pytest.mark.asyncio
async def test_activate_paramedic_without_resource(
    activate_paramedic_handler: ActivateParamedicHandler,
    paramedic: Paramedic,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test activation of a paramedic without a resource."""
    # Arrange
    paramedic_id = paramedic.id
    # Create a paramedic without a resource
    paramedic_no_resource = Paramedic(
        id=paramedic_id,
        name="Dr. No Resource",
        email="noressource@hospital.com",
        resource=None,
        assignedEmergencyId=None,
    )
    mock_user_manager.add_user(paramedic_no_resource)

    command = ActivateParamedicCommand(paramedicId=paramedic_id)

    # Act
    await activate_paramedic_handler.handle(command)

    # Assert
    # Verify the paramedic without resource was saved correctly
    retrieved_paramedic = await mock_realtime_storage.get_paramedic(paramedic_id)
    assert retrieved_paramedic is not None
    assert retrieved_paramedic.id == paramedic_id
    assert retrieved_paramedic.resource is None


@pytest.mark.asyncio
async def test_activate_paramedic_idempotent(
    activate_paramedic_handler: ActivateParamedicHandler,
    paramedic: Paramedic,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test that activating the same paramedic multiple times is idempotent."""
    # Arrange
    paramedic_id = paramedic.id
    mock_user_manager.add_user(paramedic)

    command = ActivateParamedicCommand(paramedicId=paramedic_id)

    # Act - activate twice
    await activate_paramedic_handler.handle(command)
    await activate_paramedic_handler.handle(command)

    # Assert
    # Verify user manager was called twice
    user_calls = mock_user_manager.get_get_user_calls()
    assert len(user_calls) == 2

    # Verify paramedic was saved twice (idempotent operation)
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 2

    # Verify the final state is correct
    retrieved_paramedic = await mock_realtime_storage.get_paramedic(paramedic_id)
    assert retrieved_paramedic is not None
    assert retrieved_paramedic.id == paramedic_id


@pytest.mark.asyncio
async def test_activate_paramedic_with_different_types(
    activate_paramedic_handler: ActivateParamedicHandler,
    paramedic: Paramedic,
    non_paramedic_user: User,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test that the handler correctly identifies paramedic vs non-paramedic users."""
    # Arrange
    paramedic_id = paramedic.id
    user_id = non_paramedic_user.id

    # Add both users to the user manager
    mock_user_manager.add_user(paramedic)
    mock_user_manager.add_user(non_paramedic_user)

    # Act - try to activate both
    # First, activate the paramedic (should succeed)
    command1 = ActivateParamedicCommand(paramedicId=paramedic_id)
    await activate_paramedic_handler.handle(command1)

    # Second, try to activate the non-paramedic user (should fail)
    command2 = ActivateParamedicCommand(paramedicId=user_id)
    with pytest.raises(UserNotFoundError):
        await activate_paramedic_handler.handle(command2)

    # Assert
    # Verify only the paramedic was saved to real-time storage
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 1
    assert paramedic_calls[0][1].id == paramedic_id

    # Verify both user retrievals were attempted
    user_calls = mock_user_manager.get_get_user_calls()
    assert len(user_calls) == 2
    assert user_calls[0] == paramedic_id
    assert user_calls[1] == user_id
