import uuid
from typing import TypeVar

from core.domain.entities.user import User

from . import Port


class UserManagerPort(Port):
    async def get_user[T: User](self, id: uuid.UUID) -> T | None:
        """Get a user by id

        Args:
            id: The id of the user to retrieve

        Returns:
            User with matching id or None if no such user was found.
            This most must attempt to get the most specific kind
            of user possible.
        """
        raise NotImplementedError
