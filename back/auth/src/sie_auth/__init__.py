"""SIEE Authentication Package.

This package provides authentication services and utilities for the SIEE system,
including a REST API for token management and a library for authentication
utilities that can be used across multiple services.
"""

# Expose the main components of the package
from .lib import (
    AuthUser,
    Token,
    authenticate_user,
    create_access_token,
    generate_get_current_user_dep,
    get_password_hash,
    get_user_in_token,
    verify_password,
)

__all__ = [
    # Library components
    "AuthUser",
    "Token",
    "authenticate_user",
    "create_access_token",
    "get_user_in_token",
    "verify_password",
    "get_password_hash",
    "generate_get_current_user_dep",
]
