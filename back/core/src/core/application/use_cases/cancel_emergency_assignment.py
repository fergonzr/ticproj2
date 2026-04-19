import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError


class CancelEmergencyAssignmentCommand(DefaultedRequest):
    emergencyId: uuid.UUID
    reason: str


class CancelEmergencyAssignmentHandler(
    cqrs.RequestHandler[CancelEmergencyAssignmentCommand, None]
):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: CancelEmergencyAssignmentCommand):
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.cancel_assignment()

        await self._storage.save_emergency(emergency)
        await self._coordinator.report_assignment_cancelled(emergency)


CancelEmergencyAssignmentCommand.defaultHandler = CancelEmergencyAssignmentHandler
