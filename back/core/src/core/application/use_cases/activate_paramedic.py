import uuid
from typing import ClassVar

import cqrs

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.ports.user_manager import UserManagerPort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.user import Paramedic, User, UserNotFoundError


class ActivateParamedicCommand(DefaultedRequest):
    """A command to activate a paramedic on the RealTime storage database."""

    paramedicId: uuid.UUID


class ActivateParamedicHandler(cqrs.RequestHandler[ActivateParamedicCommand, None]):
    """Handler for processing ActivateParamedicCommand

    Attributes:
        rtStore: The real-time storage port for saving the paramedic
        on the real time database
        userManager: The UserManager port to retrieve the paramedic user
    """

    def __init__(self, rtStore: RealTimeStoragePort, userManager: UserManagerPort):
        super().__init__()
        self.rtStore = rtStore
        self.userManager = userManager

    async def handle(self, request: ActivateParamedicCommand):
        """Handles the paramedic activation command.

        Args:
            request: The ActivateParamedicCommand containing the id of
            the paramedic to activate.
        """

        paramedic = await self.userManager.get_user(request.paramedicId)

        # Not returning a more specific error for security reasons.
        if not isinstance(paramedic, Paramedic):
            raise UserNotFoundError(request.paramedicId)

        await self.rtStore.save_paramedic(paramedic)


ActivateParamedicCommand.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    ActivateParamedicHandler
)
