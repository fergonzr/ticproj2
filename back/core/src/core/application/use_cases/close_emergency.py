"""Use case to close an emergency.

This module defines the CloseEmergencyCommand and its handler
to close an emergency by an operator.
"""

import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError


class CloseEmergencyCommand(DefaultedRequest):
    """Command for closing an emergency.

    This command is intended to be used by an operator when they need to
    close a resolved emergency, effectively releasing all resources assigned to it.
    This should only be done after the emergency has been properly resolved.

    Attributes:
        emergencyId: The id of the emergency to close.
    """

    emergencyId: uuid.UUID


class CloseEmergencyHandler(cqrs.RequestHandler[CloseEmergencyCommand, None]):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: CloseEmergencyCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.close()
        await self._storage.save_emergency(emergency)

        # Report the closing through the coordinator
        if hasattr(self._coordinator, "report_closing"):
            await self._coordinator.report_closing(emergency)


CloseEmergencyCommand.defaultHandler = CloseEmergencyHandler
