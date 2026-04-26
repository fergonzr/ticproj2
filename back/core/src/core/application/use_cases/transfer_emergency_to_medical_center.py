"""Use case to transfer an emergency to a medical center.

This module defines the TransferEmergencyToMedicalCenterCommand and its handler
to transfer an emergency to a medical center by a paramedic.
"""

import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.medical_center_manager import MedicalCenterManagerPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.entities.medical_center import MedicalCenterNotFoundError


class TransferEmergencyToMedicalCenterCommand(DefaultedRequest):
    """Command for transferring an emergency to a medical center.

    This command is intended to be used by a paramedic when they have assessed
    the situation and decided which medical center the patient should be transferred to.
    The medical center must be able to handle the emergency's complexity level.

    Attributes:
        emergencyId: The id of the emergency to transfer.
        medicalCenterId: The id of the medical center to transfer to.
    """

    emergencyId: uuid.UUID
    medicalCenterId: uuid.UUID


class TransferEmergencyToMedicalCenterHandler(
    cqrs.RequestHandler[TransferEmergencyToMedicalCenterCommand, None]
):
    def __init__(
        self,
        coordinator: CoordinatorPort,
        storage: RealTimeStoragePort,
        medicalCenterManager: MedicalCenterManagerPort,
    ) -> None:
        self._coordinator = coordinator
        self._storage = storage
        self._medicalCenterManager = medicalCenterManager

    async def handle(self, request: TransferEmergencyToMedicalCenterCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        medical_center = await self._medicalCenterManager.get_medical_center_by_id(
            request.medicalCenterId
        )
        if medical_center is None:
            raise MedicalCenterNotFoundError(request.medicalCenterId)

        emergency.mark_transfer(medical_center.info())
        await self._storage.save_emergency(emergency)

        # Report the transfer through the coordinator
        await self._coordinator.report_transfer(emergency)


TransferEmergencyToMedicalCenterCommand.defaultHandler = (
    TransferEmergencyToMedicalCenterHandler
)
