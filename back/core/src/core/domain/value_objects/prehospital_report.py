from dataclasses import dataclass

from core.domain.entities.emergency import Emergency
from core.domain.entities.medical_center import ComplexityLevel
from core.domain.value_objects.medical_info import MedicalInfo
from core.domain.value_objects.triage import Triage


@dataclass
class PreHospitalReport:
    """A class that stores relevant information of an emergency for the
    medical center the citizen will be transfered to.
    """

    medicalInfo: MedicalInfo
    triage: Triage
    complexityLevel: ComplexityLevel

    @classmethod
    def from_emergency(cls, emergency: Emergency, **kwargs):
        if (
            emergency.alert.medicalInfo is None
            or emergency.triage is None
            or emergency.complexityLevel is None
        ):
            raise ValueError

        return cls(
            medicalInfo=emergency.alert.medicalInfo,
            triage=emergency.triage,
            complexityLevel=emergency.complexityLevel,
        )
