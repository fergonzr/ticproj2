import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.ports.user_manager import UserManagerPort
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.entities.user import UserNotFoundError

from . import DefaultedRequest


class MarkEmergencyOperationCommand(DefaultedRequest):
    emergencyId: uuid.UUID
    operatorId: uuid.UUID


class MarkEmergencyOperationHandler(
    cqrs.RequestHandler[MarkEmergencyOperationCommand, None]
):
    def __init__(
        self,
        storage: RealTimeStoragePort,
        coordinator: CoordinatorPort,
        userManager: UserManagerPort,
    ):
        self.storage = storage
        self.userManager = userManager
        self.coordinator = coordinator

    async def handle(self, request: MarkEmergencyOperationCommand):
        emergency = await self.storage.get_emergency(request.emergencyId)

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        operator = await self.userManager.get_user(request.operatorId)

        if operator is None:
            raise UserNotFoundError

        emergency.set_operator(operator)

        operatedEmergencies = await self.storage.get_operated_emergencies(
            request.operatorId
        )

        if all(em.id != request.emergencyId for em in operatedEmergencies):
            operatedEmergencies.append(emergency)

        await self.storage.save_emergency(emergency)
        await self.storage.save_operated_emergencies(
            request.operatorId, list(em.id for em in operatedEmergencies)
        )
        await self.coordinator.report_operation(emergency)


MarkEmergencyOperationCommand.defaultHandler = MarkEmergencyOperationHandler
