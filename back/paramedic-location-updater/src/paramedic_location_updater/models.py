import enum
import uuid
from typing import Literal

from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentEventPayload,
)
from core.domain.entities.emergency import Emergency
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.triage import Triage
from pydantic import BaseModel


class MessageCommand(str, enum.Enum):
    UPDATE_LOCATION = "UPDATE_LOCATION"


class MessageEvent(str, enum.Enum):
    ASSIGNMENT_REQUESTED = "ASSIGNMENT_REQUESTED"


class Message(BaseModel):
    command: MessageCommand
    payload: dict


class UpdateLocationPayload(BaseModel):
    latitude: float
    longitude: float

    def to_location(self):
        return Location(latitude=self.latitude, longitude=self.longitude)


class EmergencyAssignmentRequestedPayload(BaseModel):
    alert: Alert
    triage: Triage

    @staticmethod
    def from_domain(payload: RequestEmergencyAssignmentEventPayload):
        return EmergencyAssignmentRequestedPayload(
            alert=payload.alert, triage=payload.triage
        )


class EmergencyAssignmentRequestedEvent(BaseModel):
    event: Literal[MessageEvent.ASSIGNMENT_REQUESTED]
    payload: Emergency
