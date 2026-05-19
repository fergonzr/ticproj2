import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Dict

from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.entities.medical_center import ComplexityLevel, MedicalCenterInfo
from core.domain.entities.user import GeneralUser, UserRole
from core.domain.value_objects.location import Location
from core.domain.value_objects.prehospitalcare_report import AnonimizedPrehospitalCareReport
from core.domain.value_objects.triage import Triage


@dataclass
class HistoricalEmergency:
    """An emergency whose lifecycle has been completed and is kept on
    the persistent database for archival purposes."""

    id: uuid.UUID
    location: Location | None
    filingNumber: int
    triage: Triage | None
    finalStatus: EmergencyStatus
    operatedBy: GeneralUser | None
    assignedTo: GeneralUser | None
    transferedTo: MedicalCenterInfo | None
    cancelReason: str | None
    prehospitalCareReport: AnonimizedPrehospitalCareReport | None
    timeline: Dict[EmergencyStatus, datetime]
    complexityLevel: ComplexityLevel | None = None

    @classmethod
    def from_emergency(cls, emergency: Emergency):
        return cls(
            id=emergency.id,
            location=emergency.alert.location,
            filingNumber=emergency.filingNumber,
            triage=emergency.triage,
            finalStatus=emergency.status,
            transferedTo=emergency.transferedTo,
            operatedBy=emergency.operatedBy,
            assignedTo=emergency.assignedTo,
            cancelReason=emergency.cancelReason,
            prehospitalCareReport=emergency.prehospitalCareReport,
            timeline=emergency.timeline,
            complexityLevel=emergency.complexityLevel,
        )


class IncompleteEmergencyError(Exception):
    pass


class HistoricalEmergencyNotFoundError(Exception):
    pass
