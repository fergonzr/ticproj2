"""Emergency entity module.

This module defines the Emergency entity, which represents a medical emergency
that needs to be handled by paramedics.
"""

import enum
import hashlib
import uuid
from dataclasses import dataclass
from datetime import datetime
from gzip import READ
from typing import Dict

from core.domain.entities.medical_center import ComplexityLevel, MedicalCenterInfo
from core.domain.value_objects.location import Location
from core.domain.value_objects.medical_info import MedicalInfo

from ..value_objects.alert import Alert
from ..value_objects.triage import Triage
from .user import GeneralUser, Paramedic, UnexpectedUserRoleError, User, UserRole


class EmergencyStatus(enum.Enum):
    RECEIVED = "RECEIVED"
    TAKEN = "TAKEN"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    ON_SITE = "ON_SITE"
    IN_TRANSFER = "IN_TRANSFER"
    SOLVED = "SOLVED"
    CLOSED = "CLOSED"
    CANCELED = "CANCELED"


@dataclass
class Emergency:
    """Represents an emergency situation that needs to be handled.

    An Emergency is created when someone reports a medical emergency and needs
    assistance. It contains location information, optional medical details,
    and can be assigned to a paramedic for handling.

    Attributes:
        id: Unique identifier for the emergency.
        location: The geographical location where the emergency occurred.
        medicalInfo: Optional medical information about the emergency.
        assignedTo: The paramedic assigned to handle this emergency, or None if not assigned.
        status: The status of the emergency
        triage: The initial triage made by the operator
        complexityLevel: The complexity level given by the paramedic to the emergency
    """

    id: uuid.UUID
    alert: Alert
    assignedTo: GeneralUser | None
    operatedBy: GeneralUser | None
    status: EmergencyStatus
    triage: Triage | None
    complexityLevel: ComplexityLevel | None
    transferedTo: MedicalCenterInfo | None
    prehospitalCareReportSent: bool
    cancelReason: str | None

    timeline: Dict[EmergencyStatus, datetime]

    @property
    def receivedOn(self) -> datetime:
        return self.timeline[EmergencyStatus.RECEIVED]

    @property
    def filingNumber(self) -> int:
        return int(
            hashlib.blake2b(
                bytes(str(self.timeline[EmergencyStatus.RECEIVED]), "UTF-8"),
                digest_size=5,
            ).hexdigest(),
            16,
        )

    def edit_alert(self, location: Location | None, medicalInfo: MedicalInfo | None):
        """Perform an edit on the emergency's alert data"""

        self.alert.edit(location, medicalInfo)

    def set_operator(self, operator: GeneralUser):
        if EmergencyStatus.TRIAGED in self.timeline:
            raise InvalidEmergencyStateTransitionException

        if operator.userRole != UserRole.OPERATOR:
            raise UnexpectedUserRoleError(operator.userRole, UserRole.OPERATOR)

        self.operatedBy = operator
        self.status = EmergencyStatus.TAKEN
        self.timeline[EmergencyStatus.TAKEN] = datetime.now()

    def add_triage(self, triage: Triage):
        """Add a triage to this emergency"""
        if self.status != EmergencyStatus.TAKEN:
            raise InvalidEmergencyStateTransitionException
        self.timeline[EmergencyStatus.TRIAGED] = datetime.now()
        self.triage = triage
        self.status = EmergencyStatus.TRIAGED

    def assign_to(self, paramedic: GeneralUser):
        # If the current emergency hasn't been triaged, DO NOT ALLOW ASSIGNMENT.
        if (
            self.status != EmergencyStatus.TRIAGED
            or self.timeline.get(EmergencyStatus.TRIAGED) is None
        ):
            raise InvalidEmergencyStateTransitionException

        if paramedic.userRole != UserRole.PARAMEDIC:
            raise UnexpectedUserRoleError(paramedic.userRole, UserRole.PARAMEDIC)

        # Assign this paramedic as a user
        self.assignedTo = paramedic
        self.status = EmergencyStatus.ASSIGNED
        self.timeline[EmergencyStatus.ASSIGNED] = datetime.now()

    def cancel_assignment(self):
        """Cancel the assignment of the paramedic that the emergency
        had been previously assinged to this emergency"""

        if self.assignedTo is None or self.status != EmergencyStatus.ASSIGNED:
            raise InvalidEmergencyStateTransitionException

        self.assignedTo = None
        self.status = EmergencyStatus.TRIAGED
        self.timeline.pop(EmergencyStatus.ASSIGNED)

    def mark_arrival(self):
        """Report the arrival of a the paramedic to the site of the
        emergency"""
        if (
            self.status != EmergencyStatus.ASSIGNED
            or self.timeline.get(EmergencyStatus.ASSIGNED) is None
        ):
            raise InvalidEmergencyStateTransitionException

        self.status = EmergencyStatus.ON_SITE
        self.timeline[EmergencyStatus.ON_SITE] = datetime.now()

    def add_complexity_level(self, complexityLevel: ComplexityLevel):
        """Assign a complexity level to the given emergency"""
        if (
            self.status != EmergencyStatus.ON_SITE
            or self.timeline.get(EmergencyStatus.ON_SITE) is None
            or self.assignedTo is None
        ):
            raise InvalidEmergencyStateTransitionException

        self.complexityLevel = complexityLevel

    def mark_transfer(self, medicalCenter: MedicalCenterInfo):
        """Mark the emergency as in transfer to the given medical center."""

        if (
            self.status != EmergencyStatus.ON_SITE
            or EmergencyStatus.ON_SITE not in self.timeline.keys()
            or self.complexityLevel is None
        ):
            raise InvalidEmergencyStateTransitionException

        if self.complexityLevel.value > medicalCenter.maxComplexityLevel.value:
            raise ComplexityLevelMismatchException(self.complexityLevel)

        self.transferedTo = medicalCenter
        self.status = EmergencyStatus.IN_TRANSFER
        self.timeline[EmergencyStatus.IN_TRANSFER] = datetime.now()

    def mark_prehospital_care_report_sent(self):
        """Mark that a prehospital care report has been sent for this
        emergency.

        Raises:
            InvalidEmergencyStateTransitionException: If the emergency
                does not have a complexity level assigned or has not
                been transferred to a medical center.
        """
        if (
            self.complexityLevel is None
            or self.transferedTo is None
            or self.status != EmergencyStatus.IN_TRANSFER
        ):
            raise InvalidEmergencyStateTransitionException

        self.prehospitalCareReportSent = True

    def mark_resolution(self):
        """Mark the emergency as resolved. This happens either when
        the citizen is succesfulyy delivered to the medical center or
        when the paramedic deems transfer to be unecesary. Regardless,
        it is responsability of the paramedic to do so."""

        if (
            self.status != EmergencyStatus.ON_SITE
            and self.status != EmergencyStatus.IN_TRANSFER
        ):
            raise InvalidEmergencyStateTransitionException

        if (
            self.status == EmergencyStatus.IN_TRANSFER
            and not self.prehospitalCareReportSent
        ):
            raise InvalidEmergencyStateTransitionException

        if self.complexityLevel is None:
            raise InvalidEmergencyStateTransitionException

        self.status = EmergencyStatus.SOLVED
        self.timeline[EmergencyStatus.SOLVED] = datetime.now()

    def close(self):
        """Close the emergency, effectively releasing all the resources
        previously assigned to it. This must be done by the operator."""

        if (
            self.status != EmergencyStatus.SOLVED
            or EmergencyStatus.SOLVED not in self.timeline.keys()
        ):
            raise InvalidEmergencyStateTransitionException

        self.status = EmergencyStatus.CLOSED
        self.timeline[EmergencyStatus.CLOSED] = datetime.now()

    def cancel(self, byCitizen: bool, reason: str | None = None):
        """Cancel the emergency, also releaseing all resources. This
        may be done by either the operator or citizen, but they are
        allowed to do so at different times.

        Arguments:
            byCitizen: Wether the cancellation request was sent by a citizen or not.
        """

        # The citizen can only cancel on these states
        if byCitizen and self.status not in (
            EmergencyStatus.RECEIVED,
            EmergencyStatus.TRIAGED,
            EmergencyStatus.ASSIGNED,
        ):
            raise InvalidEmergencyStateTransitionException()

        # The operator can only cancel before assigning an emergency
        if not byCitizen and (
            self.status not in (EmergencyStatus.RECEIVED, EmergencyStatus.TRIAGED)
        ):
            raise InvalidEmergencyStateTransitionException()

        if not byCitizen and reason is None:
            raise ValueError()

        self.cancelReason = f"By: {'citizen' if byCitizen else 'operator'} \n {reason if reason is not None else ''}"
        self.status = EmergencyStatus.CANCELED
        self.timeline[EmergencyStatus.CANCELED] = datetime.now()

    @classmethod
    def from_alert(cls, alert: Alert):
        receivedTimestamp = datetime.now()
        return Emergency(
            id=uuid.uuid4(),
            alert=alert,
            assignedTo=None,
            status=EmergencyStatus.RECEIVED,
            triage=None,
            complexityLevel=None,
            operatedBy=None,
            transferedTo=None,
            prehospitalCareReportSent=False,
            cancelReason=None,
            timeline={EmergencyStatus.RECEIVED: receivedTimestamp},
        )


class EmergencyNotFoundError(LookupError):
    emergencyId: uuid.UUID

    def __init__(self, emergencyId: uuid.UUID, *args: object) -> None:
        self.emergencyId = emergencyId
        super().__init__(*args)


class InvalidEmergencyStateTransitionException(Exception):
    pass


class ComplexityLevelMismatchException(Exception):
    def __init__(self, complexityLevel: ComplexityLevel):
        self.complexityLevel = complexityLevel
