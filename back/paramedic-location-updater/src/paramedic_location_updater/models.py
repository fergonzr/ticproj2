import enum
import uuid
from typing import Literal

from core.domain.value_objects.location import Location
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


class EmergencyAssignmentRequestedEvent(BaseModel):
    event: Literal[MessageEvent.ASSIGNMENT_REQUESTED]
    payload: uuid.UUID
