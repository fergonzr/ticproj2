"""Use case to report prehospital care to a medical center.

This module defines the ReportPrehospitalCareCommand and its handler
to report prehospital care information to a medical center after an
emergency has been transferred.
"""

import uuid

import cqrs

from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.prehospitalcare_reporter import (
    PrehospitalCareReporterPort,
)
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.value_objects.prehospitalcare_report import (
    PatientStatus,
    PrehopitalCareReport,
)


class ReportPrehospitalCareCommand(DefaultedRequest):
    """Command for reporting prehospital care to a medical center.

    This command is intended to be used after an emergency has been transferred
    to a medical center, to report the prehospital care information that was
    provided to the patient.

    Attributes:
        emergencyId: The id of the emergency to report.
        initialStateDescription: Description of the initial state.
        treatmentDescription: Description of the treatment provided.
        finalState: The final state of the patient after care was provided.
        finalStateDescription: Description of the final state.
    """

    emergencyId: uuid.UUID
    initialStateDescription: str
    treatmentDescription: str
    finalState: PatientStatus
    finalStateDescription: str


class ReportPrehospitalCareHandler(
    cqrs.RequestHandler[ReportPrehospitalCareCommand, None]
):
    def __init__(
        self,
        storage: RealTimeStoragePort,
        prehospitalCareReporter: PrehospitalCareReporterPort,
        coordinator: CoordinatorPort,
    ) -> None:
        self._storage = storage
        self._prehospitalCareReporter = prehospitalCareReporter
        self._coordinator = coordinator

    async def handle(self, request: ReportPrehospitalCareCommand) -> None:
        emergency = await self._storage.get_emergency(request.emergencyId)
        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        if emergency.transferedTo is None:
            raise ValueError("Emergency has not been transferred to a medical center")

        if emergency.complexityLevel is None:
            raise ValueError("Emergency does not have a complexity level assigned")

        # Extract medical info from the emergency's alert
        medical_info = emergency.alert.medicalInfo
        if medical_info is None:
            raise ValueError(
                "Emergency does not contain medical information for prehospital care report"
            )

        # Build the prehospital care report
        report = PrehopitalCareReport(
            medicalInfo=medical_info,
            initialComplexityLevel=emergency.complexityLevel,
            initialStateDescription=request.initialStateDescription,
            treatmentDescription=request.treatmentDescription,
            finalState=request.finalState,
            finalStateDescription=request.finalStateDescription,
        )

        # Report the prehospital care to the medical center
        await self._prehospitalCareReporter.report_prehospital_care(
            emergency.transferedTo,
            report,
        )

        # Mark the emergency as having sent a prehospital care report
        emergency.mark_prehospital_care_report_sent()
        await self._storage.save_emergency(emergency)

        # Report the prehospital care report through the coordinator
        await self._coordinator.report_prehospital_care_reported(emergency)


ReportPrehospitalCareCommand.defaultHandler = ReportPrehospitalCareHandler
