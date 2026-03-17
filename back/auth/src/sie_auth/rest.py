"""REST API for authentication service.

This module provides the FastAPI application for the authentication service,
including endpoints for token management and user information retrieval.
It depends on the authentication library for core authentication functionality.
"""

import logging
from datetime import timedelta
from typing import Annotated

import cqrs
from core.application.factories import create_mediator
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from .lib import (
    AuthUser,
    Token,
    authenticate_user,
    create_access_token,
    get_current_user,
)

# Configuration
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# Initialize service discovery and mediator
discoveryAdapter = DockerServiceDiscoveryAdapter("docker-compose.yaml")
appMediator: cqrs.RequestMediator = create_mediator(
    discoveryAdapter,
    useCases=[GetUserByEmailQuery],
)

app = FastAPI()

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_mediator() -> cqrs.RequestMediator:
    """Get the CQRS mediator instance."""
    return appMediator


@app.post("/api/v1/auth/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    """Get a JWT token for authentication.

    This endpoint implements OAuth2 token generation. It accepts email/password
    credentials and returns a JWT access token that can be used to authenticate
    subsequent requests.

    Args:
        form_data: Form data containing username (email) and password.

    Returns:
        A Token object containing the access token and token type.

    Raises:
        HTTPException: If authentication fails.
    """
    user = await authenticate_user(
        form_data.username, form_data.password, get_mediator()
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires,
        secret_key=SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return Token(access_token=access_token, token_type="bearer")


@app.get("/api/v1/auth/whoami")
async def whoami(
    current_user: Annotated[
        AuthUser,
        Depends(
            lambda: get_current_user(
                token=Depends(oauth2_scheme),
                mediator=get_mediator(),
                secret_key=SECRET_KEY,
                algorithm=ALGORITHM,
            )
        ),
    ],
) -> AuthUser:
    """Get information about the currently authenticated user.

    This endpoint returns information about the user who is currently
    authenticated via the JWT token in the Authorization header.

    Args:
        current_user: The current user, injected by the dependency.

    Returns:
        User information including email, name, and user role.
    """
    logger.info(f"Returning user info for {current_user.email}")
    return current_user
