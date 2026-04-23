import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.value_objects.location import Location
from core.domain.value_objects.medical_info import MedicalInfo


class EditAlertCommand(DefaultedRequest):
    """Command to edit an emergency's Alert field"""

    emergencyId: uuid.UUID
    location: Location | None
    medicalInfo: MedicalInfo | None


class EditAlertHandler(cqrs.RequestHandler[EditAlertCommand, None]):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: EditAlertCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.edit_alert(request.location, request.medicalInfo)

        await self._storage.save_emergency(emergency)
        await self._coordinator.report_alert_edited(emergency)


EditAlertCommand.defaultHandler = EditAlertHandler
