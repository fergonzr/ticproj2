from core.application.ports.port import Port
from core.domain.entities.medical_center import MedicalCenterInfo
from core.domain.value_objects.prehospitalcare_report import PrehopitalCareReport


class PrehospitalCareReporterPort(Port):
    """A port to report the emergency transfers to the given medical
    center"""

    async def report_prehospital_care(
        self, medicalCenter: MedicalCenterInfo, report: PrehopitalCareReport
    ):
        """Report the given emergency to the specified medical center.

        Args:
            medicalCenter: The medical center to report this emergency to.
            report: The report containing the relevant emergency information.
        """
        raise NotImplementedError
