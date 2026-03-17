import uuid
from typing import TypeVar

from core.domain.entities.user import User

from . import Port


class UserManagerPort(Port):
    async def get_user(self, id: uuid.UUID) -> User | None:
        """Get a user by id

        Args:
            id: The id of the user to retrieve

        Returns:
            User with matching id or None if no such user was found.
            The caller is responsible for converting it to the
            appropriate subclass according to its userRole field if
            needed.
        """
        raise NotImplementedError

    async def get_user_by_email(self, email: str) -> User | None:
        """Get a user by its email

        Args:
            email: The email of the user.

        Returns:
            User with the specified email or None if no such user is found.
        """
        raise NotImplementedError
