import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.entities.user import UserNotFoundError


class CancelEmergencyCommand(DefaultedRequest):
    """Command to cancel an emergency, either by an operator or user."""

    byCitizen: bool
    reason: str | None
    emergencyId: uuid.UUID


class CancelEmergencyHandler(cqrs.RequestHandler[CancelEmergencyCommand, None]):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: CancelEmergencyCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.cancel(request.byCitizen, request.reason)

        if emergency.assignedTo is not None:
            paramedic = await self._storage.get_paramedic(emergency.assignedTo.id)
            if paramedic is None:
                raise UserNotFoundError

            paramedic.release()
            await self._storage.save_paramedic(paramedic)

        await self._storage.save_emergency(emergency)
        await self._coordinator.report_cancel(emergency)


CancelEmergencyCommand.defaultHandler = CancelEmergencyHandler
