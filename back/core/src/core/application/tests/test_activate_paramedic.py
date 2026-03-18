"""Tests for the ActivateParamedic use case.

This module contains integration tests for the ActivateParamedicHandler
which activates paramedics in the real-time storage database.

IMPORTANT: The UserManagerPort returns generic User objects, not type-specific
user objects. The use case is responsible for:
1. Retrieving the generic User object from UserManager
2. Checking the userRole field to determine the actual user type
3. Converting to the appropriate subclass (Paramedic) if needed
4. Validating that the user has the correct role (UserRole.PARAMEDIC)

This design follows the principle of separation of concerns:
- UserManager is responsible for user retrieval and authentication
- The use case is responsible for business logic and type conversion
- RealTimeStorage is responsible for persisting the specific user type
"""

import uuid
from datetime import datetime

import pytest

from core.application.use_cases.activate_paramedic import (
    ActivateParamedicCommand,
    ActivateParamedicHandler,
)
from core.domain.entities.user import Paramedic, User, UserNotFoundError, UserRole
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
        passwordHash="hashed_password_123",
        userRole=UserRole.PARAMEDIC,
        resource=None,
        assignedEmergencyId=None,
    )


@pytest.fixture
def non_paramedic_user() -> User:
    """Fixture providing a non-paramedic user (operator) for testing error cases."""
    return User(
        id=uuid.uuid4(),
        name="Regular User",
        email="user@example.com",
        passwordHash="hashed_password_456",
        userRole=UserRole.OPERATOR,
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
    # UserManager returns generic User objects
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
    assert retrieved_paramedic.userRole == UserRole.PARAMEDIC


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
    """Test activation of a user that is not a paramedic (operator user).

    This test verifies that the use case correctly identifies users with
    UserRole.OPERATOR and rejects them, even though UserManager returns
    generic User objects.
    """
    # Arrange
    user_id = non_paramedic_user.id
    # UserManager returns generic User objects
    mock_user_manager.add_user(non_paramedic_user)

    command = ActivateParamedicCommand(paramedicId=user_id)

    # Act & Assert
    with pytest.raises(UserNotFoundError):
        await activate_paramedic_handler.handle(command)

    # Verify no calls were made to real-time storage
    paramedic_calls = mock_realtime_storage.get_paramedic_calls()
    assert len(paramedic_calls) == 0


@pytest.mark.asyncio
async def test_activate_paramedic_without_resource(
    activate_paramedic_handler: ActivateParamedicHandler,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test activation of a paramedic without a resource.

    This test verifies that the use case correctly handles paramedics without
    resources, even though UserManager returns generic User objects.
    """
    # Arrange
    paramedic_id = uuid.uuid4()
    # Create a paramedic without a resource
    paramedic_no_resource = Paramedic(
        id=paramedic_id,
        name="Dr. No Resource",
        email="noressource@hospital.com",
        passwordHash="hashed_password_101",
        userRole=UserRole.PARAMEDIC,
        resource=None,
        assignedEmergencyId=None,
    )
    # UserManager returns generic User objects
    mock_user_manager.add_user(paramedic_no_resource)

    command = ActivateParamedicCommand(paramedicId=paramedic_id)

    # Act
    await activate_paramedic_handler.handle(command)

    # Assert
    # Verify the paramedic without resource was saved correctly
    retrieved_paramedic = await mock_realtime_storage.get_paramedic(paramedic_id)
    assert retrieved_paramedic is not None
    assert retrieved_paramedic.id == paramedic_id
    assert retrieved_paramedic.userRole == UserRole.PARAMEDIC
    assert retrieved_paramedic.resource is None


@pytest.mark.asyncio
async def test_activate_paramedic_idempotent(
    activate_paramedic_handler: ActivateParamedicHandler,
    paramedic: Paramedic,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test that activating the same paramedic multiple times is idempotent.

    This test verifies that the use case correctly handles multiple activations
    of the same paramedic, even though UserManager returns generic User objects.
    """
    # Arrange
    paramedic_id = paramedic.id
    # UserManager returns generic User objects
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
    assert retrieved_paramedic.userRole == UserRole.PARAMEDIC


@pytest.mark.asyncio
async def test_activate_paramedic_with_different_types(
    activate_paramedic_handler: ActivateParamedicHandler,
    paramedic: Paramedic,
    non_paramedic_user: User,
    mock_user_manager: MockUserManagerPort,
    mock_realtime_storage: MockRealTimeStoragePort,
):
    """Test that the handler correctly identifies paramedic vs non-paramedic users.

    This test verifies that the use case correctly discriminates between user types
    based on the userRole field, even though UserManager returns generic User objects.
    """
    # Arrange
    paramedic_id = paramedic.id
    user_id = non_paramedic_user.id

    # Add both users to the user manager
    # UserManager returns generic User objects
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
