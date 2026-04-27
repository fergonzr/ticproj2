import cqrs
from cqrs.events.event import uuid

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.user import UserNotFoundError

from . import DefaultedRequest


class DeleteParamedicFromRTDbCommand(DefaultedRequest):
    """Delete a paramedic from the real time storage database. This is
    relevant when, for example, a paramedic goes offline."""

    paramedicId: uuid.UUID


class DeleteParamedicFromRTDbHandler(
    cqrs.RequestHandler[DeleteParamedicFromRTDbCommand, None]
):
    """Handler for DeleteParamedicFromRTDbCommand"""

    def __init__(self, storage: RealTimeStoragePort):
        self.storage = storage

    async def handle(self, request: DeleteParamedicFromRTDbCommand):
        paramedic = await self.storage.get_paramedic(request.paramedicId)

        if paramedic is None:
            raise UserNotFoundError(request.paramedicId)

        # Only delete from db if it hasn't been assigned to an
        # emergency
        if paramedic.assignedEmergencyId is None:
            await self.storage.delete_paramedic(request.paramedicId)


DeleteParamedicFromRTDbCommand.defaultHandler = DeleteParamedicFromRTDbHandler
