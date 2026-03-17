"""Authentication library for SIEE services.

This module provides reusable authentication utilities that can be used across
multiple services in the SIEE system. It includes functions for token validation
and user retrieval that can be integrated into other FastAPI applications.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Protocol

import cqrs
import jwt
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.domain.entities.user import User as DomainUser
from core.domain.entities.user import UserNotFoundError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel

logger = logging.getLogger(__name__)


# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str


class AuthUser(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None = None
    userRole: str | None = None


class AuthUserInDB(AuthUser):
    passwordHash: str


class UserManagerPort(Protocol):
    async def get_user_by_email(self, email: str) -> DomainUser | None:
        """Get a user by email."""
        ...


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Args:
        plain_password: The plain text password to verify.
        hashed_password: The hashed password to verify against.

    Returns:
        True if the password matches, False otherwise.
    """
    password_hash = PasswordHash.recommended()
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password for storage.

    Args:
        password: The plain text password to hash.

    Returns:
        The hashed password.
    """
    password_hash = PasswordHash.recommended()
    return password_hash.hash(password)


async def get_user_by_email(
    email: str, mediator: cqrs.RequestMediator
) -> AuthUserInDB | None:
    """Get user by email using the CQRS mediator.

    Args:
        email: The email address to search for.
        mediator: The CQRS mediator to use for sending queries.

    Returns:
        AuthUserInDB object if found, None otherwise.
    """
    try:
        query = GetUserByEmailQuery(email=email)
        # Send the query through the mediator
        result = await mediator.send(query)
        user = result.user
        if user is None:
            return None

        # Convert User entity to AuthUserInDB model
        return AuthUserInDB(
            id=user.id,
            email=user.email,
            name=user.name,
            userRole=user.userRole.value if hasattr(user, "userRole") else None,
            passwordHash=user.passwordHash,
        )
    except UserNotFoundError:
        logger.info(f"User not found with email: {email}")
        return None
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None


async def authenticate_user(
    email: str, password: str, mediator: cqrs.RequestMediator
) -> AuthUserInDB | None:
    """Authenticate a user by email and password.

    Args:
        email: The user's email address.
        password: The user's plain text password.
        mediator: The CQRS mediator to use for user retrieval.

    Returns:
        AuthUserInDB object if authentication succeeds, None otherwise.
    """
    user = await get_user_by_email(email, mediator)
    if not user:
        # Verify against dummy hash to prevent timing attacks
        dummy_hash = get_password_hash("dummypassword")
        verify_password(password, dummy_hash)
        return None
    if not verify_password(password, user.passwordHash):
        return None
    return user


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
    secret_key: str = "default-secret-key",
    algorithm: str = "HS256",
) -> str:
    """Create a JWT access token.

    Args:
        data: The data to encode in the token.
        expires_delta: Optional token expiration time.
        secret_key: The secret key to use for signing the token.
        algorithm: The algorithm to use for signing the token.

    Returns:
        The encoded JWT token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


async def get_user_in_token(
    token: str,
    mediator: cqrs.RequestMediator,
    secret_key: str = "default-secret-key",
    algorithm: str = "HS256",
) -> AuthUser | None:
    """Get user from a JWT token.

    This function validates a JWT token and returns the associated user.
    It can be used in WebSocket connections or other contexts where
    FastAPI's dependency injection is not available.

    Args:
        token: The JWT token to validate.
        mediator: The CQRS mediator to use for user retrieval.
        secret_key: The secret key to use for token validation.
        algorithm: The algorithm used for token signing.

    Returns:
        AuthUser object if token is valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        email = payload.get("sub")
        if email is None:
            return None

        user = await get_user_by_email(email, mediator)
        if user is None:
            return None

        return AuthUser(
            id=user.id,
            email=user.email,
            name=user.name,
            userRole=user.userRole,
        )
    except (InvalidTokenError, Exception) as e:
        logger.error(f"Error validating token: {e}")
        return None


async def get_current_user(
    token: Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="token"))],
    mediator: cqrs.RequestMediator,
    secret_key: str = "default-secret-key",
    algorithm: str = "HS256",
) -> AuthUser:
    """FastAPI dependency to get the current user from a JWT token.

    This dependency can be used in any FastAPI endpoint to require authentication
    and automatically extract the current user from the JWT token.

    Args:
        token: The JWT token from the Authorization header.
        mediator: The CQRS mediator to use for user retrieval.
        secret_key: The secret key to use for token validation.
        algorithm: The algorithm used for token signing.

    Returns:
        The current AuthUser.

    Raises:
        HTTPException: If the token is invalid or the user is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = await get_user_in_token(token, mediator, secret_key, algorithm)
    if user is None:
        raise credentials_exception
    return user
