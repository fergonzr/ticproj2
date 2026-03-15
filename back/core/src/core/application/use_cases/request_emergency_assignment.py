import uuid
from datetime import datetime

import cqrs
from typing_extensions import ClassVar

from core.application.ports.location_updater import ParamedicLocationUpdaterPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError


class RequestEmergencyAssignmentCommand(DefaultedRequest):
    """Command for assigning an emergency to a paramedic"""

    paramedicId: uuid.UUID
    emergencyId: datetime
    """The URL that the paramedic must connect to in order to confirm
    the assignment of the emergency"""
    confirmationURL: str


class RequestEmergencyAssignmentHandler(
    cqrs.RequestHandler[RequestEmergencyAssignmentCommand, None]
):
    def __init__(
        self,
        storage: RealTimeStoragePort,
        locationUpdater: ParamedicLocationUpdaterPort,
    ):
        """Initialize the handler with a reference to a ParamedicLocationUpdaterPort"""

        self.storage = storage
        self.locationUpdater = locationUpdater

    async def handle(self, request: RequestEmergencyAssignmentCommand) -> None:
        """Handle the request of an assignment by passing it to the
        ParamedicLocationUpdaterPort"""

        emergency = await self.storage.get_emergency(request.emergencyId)

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        await self.locationUpdater.request_emergency_assignment(
            request.paramedicId, emergency, request.confirmationURL
        )


RequestEmergencyAssignmentCommand.defaultHandler: ClassVar[
    type[cqrs.RequestHandler]
] = RequestEmergencyAssignmentHandler
