import dataclasses
import uuid
from typing import ClassVar

import cqrs

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.ports.user_manager import UserManagerPort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.user import Paramedic, User, UserNotFoundError, UserRole
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource


class ActivateParamedicCommand(DefaultedRequest):
    """A command to activate a paramedic on the RealTime storage database."""

    paramedicId: uuid.UUID

class ActivateParamedicCommandResult(cqrs.Response):
    """Response with the resultant activated paramedic"""

    paramedic: Paramedic


class ActivateParamedicHandler(cqrs.RequestHandler[ActivateParamedicCommand, ActivateParamedicCommandResult]):
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

    async def handle(self, request: ActivateParamedicCommand) -> ActivateParamedicCommandResult:
        """Handles the paramedic activation command.

        Args:
            request: The ActivateParamedicCommand containing the id of
            the paramedic to activate.
        """
        # Do not activate if already on the realtime storage
        paramedicOnRtDb = await self.rtStore.get_paramedic(request.paramedicId)
        if paramedicOnRtDb is not None:
            return ActivateParamedicCommandResult(paramedic=paramedicOnRtDb)

        user = await self.userManager.get_user(request.paramedicId)

        # Not returning a more specific error for security reasons.
        if user is None:
            raise UserNotFoundError(request.paramedicId)

        if user.userRole != UserRole.PARAMEDIC:
            raise UserNotFoundError(request.paramedicId)

        # Convert User to Paramedic by reconstructing with proper types
        paramedic = Paramedic(
            id=user.id,
            name=user.name,
            email=user.email,
            passwordHash=user.passwordHash,
            userRole=user.userRole,
        )

        await self.rtStore.save_paramedic(paramedic)
        return ActivateParamedicCommandResult(
            paramedic=paramedic
        )

ActivateParamedicCommand.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    ActivateParamedicHandler
)
