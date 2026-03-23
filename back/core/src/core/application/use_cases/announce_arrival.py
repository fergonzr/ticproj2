import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError


class AnnounceArrivalToEmergencyCommand(DefaultedRequest):
    """Command for announcing paramedic arrival to an emergency.

    This command is intended to be used by paramedics to report their arrival
    at the site of an emergency they have been assigned to.

    Attributes:
        emergencyId: The id (receivedOn timestamp) of the emergency where paramedics have arrived.
    """

    emergencyId: uuid.UUID


class AnnounceArrivalToEmergencyHandler(
    cqrs.RequestHandler[AnnounceArrivalToEmergencyCommand, None]
):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: AnnounceArrivalToEmergencyCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.mark_arrival()
        await self._storage.save_emergency(emergency)
        await self._coordinator.report_arrival(emergency)


AnnounceArrivalToEmergencyCommand.defaultHandler = AnnounceArrivalToEmergencyHandler
