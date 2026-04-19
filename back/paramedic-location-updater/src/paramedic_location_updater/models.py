import enum
import uuid
from typing import Dict, List, Literal, Union

from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentEventPayload,
)
from core.domain.entities.emergency import Emergency
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.triage import Triage
from pydantic import BaseModel, ValidationError


class MessageCommand(str, enum.Enum):
    SUBSCRIBE = "SUBSCRIBE"
    UNSUBSCRIBE = "UNSUBSCRIBE"
    UPDATE_LOCATION = "UPDATE_LOCATION"


class MessageEvent(str, enum.Enum):
    ASSIGNMENT_REQUESTED = "ASSIGNMENT_REQUESTED"
    LOCATION_UPDATED = "LOCATION_UPDATED"
    ERROR = "ERROR"


class Message(BaseModel):
    command: MessageCommand
    payload: dict


class UpdateLocationPayload(BaseModel):
    latitude: float
    longitude: float

    def to_location(self):
        return Location(latitude=self.latitude, longitude=self.longitude)


class SubscribeCommand(BaseModel):
    command: Literal[MessageCommand.SUBSCRIBE] = MessageCommand.SUBSCRIBE
    payload: uuid.UUID


class UnsubscribeCommand(BaseModel):
    command: Literal[MessageCommand.UNSUBSCRIBE] = MessageCommand.UNSUBSCRIBE
    payload: uuid.UUID


subscriptionStateCommand = Union[SubscribeCommand, UnsubscribeCommand]
subscriptionStateCommands: List[type[subscriptionStateCommand]] = [
    SubscribeCommand,
    UnsubscribeCommand,
]


def parse_subscription_state_command(message: Dict) -> subscriptionStateCommand:
    for commandClass in subscriptionStateCommands:
        try:
            return commandClass.model_validate(message)
        except ValidationError:
            continue
    raise InvalidCommandException


class InvalidCommandException(Exception):
    pass


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


class LocationUpdatedPayload(BaseModel):
    paramedicId: uuid.UUID
    location: Location


class ParamedicLocationUpdatedEvent(BaseModel):
    """Command to communicate the update of the location of a paramedic"""

    event: Literal[MessageEvent.LOCATION_UPDATED] = MessageEvent.LOCATION_UPDATED
    payload: LocationUpdatedPayload


class ErrorEvent(BaseModel):
    event: Literal[MessageEvent.ERROR] = MessageEvent.ERROR
    payload: str
