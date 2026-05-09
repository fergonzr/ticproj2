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
