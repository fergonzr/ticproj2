import uuid
from typing import ClassVar

import cqrs

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.user import UserNotFoundError
from core.domain.value_objects.location import Location


class UpdateParamedicLocationCommand(DefaultedRequest):
    """A command to update the location reported by a paramedic's
    resource (ambulance)."""

    paramedicId: uuid.UUID
    newLocation: Location


class UpdateParamedicLocationHandler(
    cqrs.RequestHandler[UpdateParamedicLocationCommand, None]
):
    """Handler for processing paramedic location updates"""

    def __init__(self, storage: RealTimeStoragePort) -> None:
        """Initializes the handler with storage service."""
        self.storage = storage

    async def handle(self, request: UpdateParamedicLocationCommand) -> None:
        paramedic = await self.storage.get_paramedic(request.paramedicId)

        if paramedic is None:
            raise UserNotFoundError(request.paramedicId)

        paramedic.update_location(request.newLocation)
        await self.storage.delete_paramedic(request.paramedicId)
        await self.storage.save_paramedic(paramedic)


UpdateParamedicLocationCommand.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    UpdateParamedicLocationHandler
)
