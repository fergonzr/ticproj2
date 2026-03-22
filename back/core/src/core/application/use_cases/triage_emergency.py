import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.value_objects.triage import Triage


class TriageEmergencyCommand(DefaultedRequest):
    """Command for Triaging an emergency.

    This command is inteded to be used to report the triage of an emergency.
    It should be fired by an operator user. By contrast re-triaging is the
    concern of the paramedic.

    Attributes:
        emergencyId: The id (receivedOn timestamp) of the emergency to triage.
        triage: The Triage value object to assign to the emergency.
    """

    emergencyId: uuid.UUID
    triage: Triage


class TriageEmergencyHandler(cqrs.RequestHandler[TriageEmergencyCommand, None]):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: TriageEmergencyCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.add_triage(request.triage)
        await self._storage.save_emergency(emergency)
        await self._coordinator.report_triage(emergency)


TriageEmergencyCommand.defaultHandler = TriageEmergencyHandler
