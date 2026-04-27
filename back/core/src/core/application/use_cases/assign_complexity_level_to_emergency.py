"""Use case to assign complexity level to an emergency.

This module defines the AssignComplexityLevelToEmergencyCommand and its handler
to assign a complexity level to an emergency by a paramedic.
"""

import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.entities.medical_center import ComplexityLevel


class AssignComplexityLevelToEmergencyCommand(DefaultedRequest):
    """Command for assigning complexity level to an emergency.

    This command is intended to be used by a paramedic when they arrive at the
    emergency site and assess the situation. The complexity level determines
    what type of medical center can handle the emergency.

    Attributes:
        emergencyId: The id of the emergency to assign complexity level to.
        complexityLevel: The ComplexityLevel to assign to the emergency.
    """

    emergencyId: uuid.UUID
    complexityLevel: ComplexityLevel


class AssignComplexityLevelToEmergencyHandler(
    cqrs.RequestHandler[AssignComplexityLevelToEmergencyCommand, None]
):
    def __init__(
        self, coordinator: CoordinatorPort, storage: RealTimeStoragePort
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage

    async def handle(self, request: AssignComplexityLevelToEmergencyCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        emergency.add_complexity_level(request.complexityLevel)
        await self._storage.save_emergency(emergency)
        await self._coordinator.report_complexity_assignment(emergency)


AssignComplexityLevelToEmergencyCommand.defaultHandler = (
    AssignComplexityLevelToEmergencyHandler
)
