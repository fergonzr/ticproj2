import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Dict

from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.entities.medical_center import MedicalCenterInfo
from core.domain.entities.user import User, UserRole
from core.domain.value_objects.location import Location
from core.domain.value_objects.triage import Triage


@dataclass
class HistoricalUser:
    id: uuid.UUID
    name: str
    email: str
    userRole: UserRole

    @classmethod
    def from_user(cls, user: User):
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            userRole=user.userRole,
        )


@dataclass
class HistoricalEmergency:
    """An emergency whose lifecycle has been completed and is kept on
    the persistent database for archival purposes."""

    id: uuid.UUID
    location: Location | None
    filingNumber: int
    triage: Triage | None
    finalStatus: EmergencyStatus
    operatedBy: HistoricalUser | None
    assignedTo: HistoricalUser | None
    transferedTo: MedicalCenterInfo | None
    cancelReason: str | None
    timeline: Dict[EmergencyStatus, datetime]

    @classmethod
    def from_emergency(cls, emergency: Emergency):
        return cls(
            id=emergency.id,
            location=emergency.alert.location,
            filingNumber=emergency.filingNumber,
            triage=emergency.triage,
            finalStatus=emergency.status,
            transferedTo=emergency.transferedTo,
            operatedBy=HistoricalUser.from_user(emergency.operatedBy)
            if emergency.operatedBy is not None
            else None,
            assignedTo=HistoricalUser.from_user(emergency.assignedTo)
            if emergency.assignedTo is not None
            else None,
            cancelReason=emergency.cancelReason,
            timeline=emergency.timeline,
        )


class IncompleteEmergencyError(Exception):
    pass


class HistoricalEmergencyNotFoundError(Exception):
    pass
