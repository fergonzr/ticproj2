"""Authentication library for SIEE services.

This module provides reusable authentication utilities that can be used across
multiple services in the SIEE system. It includes functions for token validation
and user retrieval that can be integrated into other FastAPI applications.
"""

import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Coroutine, Protocol

import cqrs
import jwt
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.domain.entities.user import User as DomainUser
from core.domain.entities.user import UserNotFoundError, UserRole
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Configuration from environment variables
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")

if len(SECRET_KEY) == 0:
    raise EnvironmentError("Please set JWT_SECRET_KEY")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
logger.info(SECRET_KEY)
logger.info(ALGORITHM)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str


class AuthUser(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None = None
    userRole: UserRole


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
) -> DomainUser | None:
    """Get user by email using the CQRS mediator.

    Args:
        email: The email address to search for.
        mediator: The CQRS mediator to use for sending queries.

    Returns:
        User object if found, None otherwise.
    """
    try:
        query = GetUserByEmailQuery(email=email)
        # Send the query through the mediator
        result = await mediator.send(query)
        return result.user
    except UserNotFoundError:
        logger.info(f"User not found with email: {email}")
        return None
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None


async def authenticate_user(
    email: str, password: str, mediator: cqrs.RequestMediator
) -> DomainUser | None:
    """Authenticate a user by email and password.

    Args:
        email: The user's email address.
        password: The user's plain text password.
        mediator: The CQRS mediator to use for user retrieval.

    Returns:
        User object if authentication succeeds, None otherwise.
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

    logger.info(f"Expires at {expire}")
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user_in_token(
    token: str,
    mediator: cqrs.RequestMediator,
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
        logger.info(f"Decoding {token} at {datetime.now(timezone.utc)}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
    except Exception as e:
        logger.error(f"Error validating token: {e}")
        return None


def generate_get_current_user_dep(
    mediator: cqrs.RequestMediator, roles: set[UserRole] = set()
):
    """Generate a FastAPI dependency to get the current user from the
    JWT token in the Authentication Header.

    Args:
        mediator: A RequestMediator that supports handling
        GetUserByEmailQuery
        roles: The set of allowed user roles to accept on the endpoint.
    """

    async def get_current_user(
        token: Annotated[str, Depends(oauth2_scheme)],
    ) -> AuthUser:
        user = await get_user_in_token(token, mediator)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if len(roles) > 0 and user.userRole not in roles:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You do not have the privileges to access this resource",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    return get_current_user
