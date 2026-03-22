import uuid

import cqrs
from typing_extensions import ClassVar

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.entities.user import UserNotFoundError


class ConfirmEmergencyAssignmentCommand(DefaultedRequest):
    """A command for a paramedic to confirm the assignment of an
    emergency to themselves."""

    paramedicId: uuid.UUID
    emergencyId: uuid.UUID


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

        paramedic.assign(emergency.id)
        emergency.assign_to(paramedic)

        await self.storage.save_paramedic(paramedic)
        await self.storage.save_emergency(emergency)
        await self.coordinator.report_assignment(emergency, paramedic)


ConfirmEmergencyAssignmentCommand.defaultHandler = ConfirmEmergencyAssignmentHandler
