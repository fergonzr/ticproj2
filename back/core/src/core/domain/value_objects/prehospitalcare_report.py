import enum
from dataclasses import dataclass

from core.domain.entities.medical_center import ComplexityLevel
from core.domain.value_objects.medical_info import MedicalInfo


class PatientStatus(enum.Enum):
    CRITICAL = "CRITICAL"
    DETERIORATING = "DETERIORATING"
    STABLE = "STABLE"
    IMPROVING = "IMPROVING"


@dataclass
class PrehopitalCareReport:
    medicalInfo: MedicalInfo
    initialComplexityLevel: ComplexityLevel
    initialStateDescription: str
    treatmentDescription: str
    finalState: PatientStatus
    finalStateDescription: str


@dataclass
class AnonimizedPrehospitalCareReport:
    """The non-identifiable information of a prehospital care report,
    suitable to be held by an emergency object"""

    initialStateDescription: str
    treatmentDescription: str
    finalState: PatientStatus
    finalStateDescription: str

    @classmethod
    def from_prehospitalcare_report(cls, prehospitalcareReport: PrehopitalCareReport):
        return cls(
            initialStateDescription=prehospitalcareReport.initialStateDescription,
            treatmentDescription=prehospitalcareReport.treatmentDescription,
            finalState=prehospitalcareReport.finalState,
            finalStateDescription=prehospitalcareReport.finalStateDescription
        )
