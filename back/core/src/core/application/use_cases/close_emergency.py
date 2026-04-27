"""Use case to close an emergency.

This module defines the CloseEmergencyCommand and its handler
to close an emergency by an operator.
"""

import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.historical_register import HistoricalRegisterPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import (
    EmergencyNotFoundError,
    InvalidEmergencyStateTransitionException,
)
from core.domain.entities.historical_emergency import HistoricalEmergency
from core.domain.entities.user import UserNotFoundError


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
        self,
        coordinator: CoordinatorPort,
        storage: RealTimeStoragePort,
        historicalRegister: HistoricalRegisterPort,
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage
        self._historicalRegister = historicalRegister

    async def handle(self, request: CloseEmergencyCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        if emergency.assignedTo is None:
            raise InvalidEmergencyStateTransitionException()

        paramedic = await self._storage.get_paramedic(emergency.assignedTo.id)
        if paramedic is None:
            raise UserNotFoundError(emergency.assignedTo.id)

        emergency.close()
        paramedic.release()
        await self._storage.save_paramedic(paramedic)
        await self._historicalRegister.save_emergency(
            HistoricalEmergency.from_emergency(emergency)
        )

        # Delete the emergency from the realtime database - it is now
        # saved on the historical register
        await self._storage.delete_emergency(emergency.id)

        # Report the closing through the coordinator
        if hasattr(self._coordinator, "report_closing"):
            await self._coordinator.report_closing(emergency)


CloseEmergencyCommand.defaultHandler = CloseEmergencyHandler
