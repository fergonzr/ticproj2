"""Emergency entity module.

This module defines the Emergency entity, which represents a medical emergency
that needs to be handled by paramedics.
"""

import enum
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Dict

from ..value_objects.alert import Alert
from ..value_objects.triage import Triage
from .user import Paramedic


class EmergencyStatus(enum.Enum):
    RECEIVED = "RECEIVED"
    TRIAGED = "TRIAGED"
    ASSIGNED = "ASSIGNED"
    ON_SITE = "ON_SITE"
    IN_TRANSFER = "IN_TRANSFER"
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
    """

    id: uuid.UUID
    alert: Alert
    assignedTo: Paramedic | None
    status: EmergencyStatus
    triage: Triage | None

    timeline: Dict[EmergencyStatus, datetime]

    @classmethod
    def from_alert(cls, alert: Alert):
        return Emergency(
            id=uuid.uuid4(),
            alert=alert,
            assignedTo=None,
            status=EmergencyStatus.RECEIVED,
            triage=None,
            timeline={},
        )
