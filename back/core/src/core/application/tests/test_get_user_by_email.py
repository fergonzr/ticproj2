"""Tests for the GetUserByEmail use case.

This module contains integration tests for the GetUserByEmailHandler
which retrieves users by their email address using the UserManagerPort.

The use case is responsible for:
1. Retrieving a user by their email address
2. Handling cases where the user doesn't exist
3. Returning the user information in a structured response
"""

import uuid

import pytest

from core.application.use_cases.get_user_by_email import (
    GetUserByEmailHandler,
    GetUserByEmailQuery,
    GetUserByEmailQueryResult,
)
from core.domain.entities.user import Paramedic, User, UserNotFoundError, UserRole
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource

from .mock_adapters import MockUserManagerPort, mock_user_manager


@pytest.fixture
def paramedic_user() -> Paramedic:
    """Fixture providing a sample paramedic user for testing."""
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
def operator_user() -> User:
    """Fixture providing a sample operator user for testing."""
    return User(
        id=uuid.uuid4(),
        name="System Operator",
        email="operator@hospital.com",
        passwordHash="hashed_password_456",
        userRole=UserRole.OPERATOR,
    )


@pytest.fixture
def get_user_by_email_handler(
    mock_user_manager: MockUserManagerPort,
) -> GetUserByEmailHandler:
    """Fixture providing a GetUserByEmailHandler with mock dependencies."""
    return GetUserByEmailHandler(mock_user_manager)


@pytest.mark.asyncio
async def test_get_user_by_email_success(
    get_user_by_email_handler: GetUserByEmailHandler,
    paramedic_user: Paramedic,
    mock_user_manager: MockUserManagerPort,
):
    """Test successful retrieval of a user by email."""
    # Arrange
    email = paramedic_user.email
    mock_user_manager.add_user(paramedic_user)

    query = GetUserByEmailQuery(email=email)

    # Act
    result = await get_user_by_email_handler.handle(query)

    # Assert
    assert isinstance(result, GetUserByEmailQueryResult)
    assert result.user is not None
    assert result.user.id == paramedic_user.id
    assert result.user.name == paramedic_user.name
    assert result.user.email == paramedic_user.email
    assert result.user.userRole == paramedic_user.userRole
    assert result.user.passwordHash == paramedic_user.passwordHash

    # Verify the user manager was called correctly
    # Note: MockUserManagerPort doesn't track get_user_by_email calls yet,
    # so we can't verify this directly, but we can verify the result


@pytest.mark.asyncio
async def test_get_user_by_email_nonexistent_user(
    get_user_by_email_handler: GetUserByEmailHandler,
    mock_user_manager: MockUserManagerPort,
):
    """Test retrieval of a user by email that doesn't exist."""
    # Arrange
    nonexistent_email = "nonexistent@example.com"
    query = GetUserByEmailQuery(email=nonexistent_email)

    # Act & Assert
    with pytest.raises(UserNotFoundError):
        await get_user_by_email_handler.handle(query)


@pytest.mark.asyncio
async def test_get_user_by_email_operator_user(
    get_user_by_email_handler: GetUserByEmailHandler,
    operator_user: User,
    mock_user_manager: MockUserManagerPort,
):
    """Test successful retrieval of an operator user by email.

    This test verifies that the use case correctly handles different user types
    (not just paramedics), even though UserManager returns generic User objects.
    """
    # Arrange
    email = operator_user.email
    mock_user_manager.add_user(operator_user)

    query = GetUserByEmailQuery(email=email)

    # Act
    result = await get_user_by_email_handler.handle(query)

    # Assert
    assert isinstance(result, GetUserByEmailQueryResult)
    assert result.user is not None
    assert result.user.id == operator_user.id
    assert result.user.name == operator_user.name
    assert result.user.email == operator_user.email
    assert result.user.userRole == operator_user.userRole
    assert result.user.passwordHash == operator_user.passwordHash


@pytest.mark.asyncio
async def test_get_user_by_email_with_different_users(
    get_user_by_email_handler: GetUserByEmailHandler,
    paramedic_user: Paramedic,
    operator_user: User,
    mock_user_manager: MockUserManagerPort,
):
    """Test that the handler correctly identifies different user types by email.

    This test verifies that the use case can distinguish between different
    user types based on email, even though UserManager returns generic User objects.
    """
    # Arrange
    paramedic_email = paramedic_user.email
    operator_email = operator_user.email

    # Add both users to the user manager
    mock_user_manager.add_user(paramedic_user)
    mock_user_manager.add_user(operator_user)

    # Act - retrieve both users
    paramedic_query = GetUserByEmailQuery(email=paramedic_email)
    operator_query = GetUserByEmailQuery(email=operator_email)

    paramedic_result = await get_user_by_email_handler.handle(paramedic_query)
    operator_result = await get_user_by_email_handler.handle(operator_query)

    # Assert
    # Verify paramedic retrieval
    assert paramedic_result.user is not None
    assert paramedic_result.user.userRole == UserRole.PARAMEDIC
    assert isinstance(paramedic_result.user, Paramedic)

    # Verify operator retrieval
    assert operator_result.user is not None
    assert operator_result.user.userRole == UserRole.OPERATOR
    assert isinstance(operator_result.user, User)

    # Verify they are different users
    assert paramedic_result.user.id != operator_result.user.id
    assert paramedic_result.user.email != operator_result.user.email
