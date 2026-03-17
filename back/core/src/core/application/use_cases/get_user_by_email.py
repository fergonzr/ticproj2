from typing import ClassVar

import cqrs

from core.application.ports.user_manager import UserManagerPort
from core.domain.entities.user import User, UserNotFoundError

from . import DefaultedRequest


class GetUserByEmailQuery(DefaultedRequest):
    email: str


class GetUserByEmailQueryResult(cqrs.Response):
    user: User | None


class GetUserByEmailHandler(
    cqrs.RequestHandler[GetUserByEmailQuery, GetUserByEmailQueryResult]
):
    """Handler for processing GetUserByEmailQuery.

    This handler retrieves a user by their email address using the UserManagerPort.

    Attributes:
        userManager: The UserManager port to retrieve the user by email.
    """

    def __init__(self, userManager: UserManagerPort):
        super().__init__()
        self.userManager = userManager

    async def handle(self, request: GetUserByEmailQuery) -> GetUserByEmailQueryResult:
        """Handles the get user by email query.

        Args:
            request: The GetUserByEmailQuery containing the email of the user to retrieve.

        Returns:
            User if a matching user is found. None otherwise.
        """
        # Get user by email - this follows the existing pattern where
        # handlers don't return values but perform operations
        user = await self.userManager.get_user_by_email(request.email)
        if user is None:
            raise UserNotFoundError()
        return GetUserByEmailQueryResult(user=user)


# Set the default handler for the GetUserByEmailQuery
GetUserByEmailQuery.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    GetUserByEmailHandler
)
