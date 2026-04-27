"""Use case to mark an emergency as resolved.

This module defines the MarkEmergencyAsResolvedCommand and its handler
to mark an emergency as resolved by a paramedic.
"""

import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError


class MarkEmergencyAsResolvedCommand(DefaultedRequest):
    """Command for marking an emergency as resolved.

    This command is intended to be used by a paramedic when they have successfully
    resolved the emergency, either by delivering the patient to a medical center
    or by determining that transfer is unnecessary.

    Attributes:
        emergencyId: The id of the emergency to mark as resolved.
    """

    emergencyId: uuid.UUID


class MarkEmergencyAsResolvedHandler(
    cqrs.RequestHandler[MarkEmergencyAsResolvedCommand, None]
):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: MarkEmergencyAsResolvedCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.mark_resolution()
        await self._storage.save_emergency(emergency)

        # Report the resolution through the coordinator
        if hasattr(self._coordinator, "report_resolution"):
            await self._coordinator.report_resolution(emergency)


MarkEmergencyAsResolvedCommand.defaultHandler = MarkEmergencyAsResolvedHandler
