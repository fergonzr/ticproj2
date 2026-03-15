import uuid
from datetime import datetime

import cqrs
from typing_extensions import ClassVar

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError, EmergencyStatus
from core.domain.entities.user import UserNotFoundError
from core.domain.value_objects.location import Location


class ConfirmEmergencyAssignmentCommand(DefaultedRequest):
    """A command for a paramedic to confirm the assignment of an
    emergency to themselves."""

    paramedicId: uuid.UUID
    paramedicLocation: Location
    emergencyId: datetime


class ConfirmEmergencyAssignmentHandler(
    cqrs.RequestHandler[ConfirmEmergencyAssignmentCommand, None]
):
    def __init__(self, storage: RealTimeStoragePort, coordinator: CoordinatorPort):
        self.storage = storage
        self.coordinator = coordinator

    async def handle(self, request: ConfirmEmergencyAssignmentCommand):
        emergency = await self.storage.get_emergency(request.emergencyId)

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        paramedic = await self.storage.get_paramedic(request.paramedicId)

        if paramedic is None:
            raise UserNotFoundError(request.paramedicId)

        paramedic.assign(emergency.timeline[EmergencyStatus.RECEIVED])
        emergency.assign_to(paramedic)

        await self.storage.save_paramedic(paramedic)
        await self.storage.save_emergency(emergency)
        await self.coordinator.report_assignment(emergency, paramedic)


ConfirmEmergencyAssignmentCommand.defaultHandler: ClassVar[
    type[cqrs.RequestHandler]
] = ConfirmEmergencyAssignmentHandler
