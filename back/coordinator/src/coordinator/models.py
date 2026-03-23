"""Models used to communicate events and commands to and from clients"""

import enum
import logging
import uuid
from typing import Dict, List, Literal, Union

from core.application.use_cases import DefaultedRequest
from core.application.use_cases.announce_arrival import (
    AnnounceArrivalToEmergencyCommand as CoreAnnounceArrivalCommand,
)
from core.application.use_cases.report_emergency import (
    ReportEmergencyCommand as CoreReportEmergencyCommand,
)
from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentCommand as CoreRequestEmergencyAssignmentCommand,
)
from core.application.use_cases.triage_emergency import (
    TriageEmergencyCommand as CoreTriageEmergencyCommand,
)
from core.domain.entities import Emergency
from core.domain.value_objects.alert import Alert
from pydantic import BaseModel, ValidationError

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


class MessageCommand(str, enum.Enum):
    REPORT = "REPORT_EMERGENCY"
    TRIAGE = "TRIAGE_EMERGENCY"
    REQUEST_ASSIGN = "REQUEST_EMERGENCY_ASSIGNMENT"
    SET_AVAILABILITY = "SET_AVAILABILITY"
    SUBSCRIBE = "SUBSCRIBE"
    ARRIVE = "ANNOUNCE_ARRIVAL"


class MessageEvent(enum.Enum):
    GREETING = "USER_GREET"
    RECEIVED = "EMERGENCY_RECEIVED"
    TRIAGED = "EMERGENCY_TRIAGED"
    ASSIGNED = "EMERGENCY_ASSIGNED"
    ARRIVED = "EMERGENCY_ARRIVED"
    ERROR = "ERROR"


class ReportEmergencyCommand(BaseModel):
    command: Literal[MessageCommand.REPORT]
    payload: Alert

    def to_domain(self) -> CoreReportEmergencyCommand:
        return CoreReportEmergencyCommand(alert=self.payload)


class SubscribeToEmergencyCommand(BaseModel):
    """A command for the operator or citizen to subscribe to events
    related to an already reported emergency.

    Attributes:
        command: A literal MessageCommand.SUBSCRIBE.
        payload: The emergency id to subscribe to.
    """

    command: Literal[MessageCommand.SUBSCRIBE] = MessageCommand.SUBSCRIBE
    payload: uuid.UUID


citizenCommand = Union[ReportEmergencyCommand, SubscribeToEmergencyCommand]
citizenCommands: List[type[citizenCommand]] = [
    ReportEmergencyCommand,
    SubscribeToEmergencyCommand,
]


def parse_citizen_command(message: dict) -> citizenCommand:
    for commandClass in citizenCommands:
        try:
            return commandClass.model_validate(message)
        except ValidationError as e:
            logger.info(e)
            continue
    raise InvalidCommandException


class BaseOperatorBusinessCommand(BaseModel):
    """Base class for all commands that can be issued by an operator
    and have an effect on the business state"""

    def to_domain(self) -> DefaultedRequest:
        raise NotImplementedError


class TriageEmergencyCommand(BaseOperatorBusinessCommand):
    command: Literal[MessageCommand.TRIAGE]
    payload: CoreTriageEmergencyCommand

    def to_domain(self) -> CoreTriageEmergencyCommand:
        return self.payload


class RequestEmergencyAssignmentPayload(BaseModel):
    emergencyId: uuid.UUID
    paramedicId: uuid.UUID


class RequestEmergencyAssignmentCommand(BaseOperatorBusinessCommand):
    command: Literal[MessageCommand.REQUEST_ASSIGN]
    payload: RequestEmergencyAssignmentPayload

    def to_domain(self) -> CoreRequestEmergencyAssignmentCommand:
        return CoreRequestEmergencyAssignmentCommand(
            emergencyId=self.payload.emergencyId,
            paramedicId=self.payload.paramedicId,
        )


class SetOperatorAvailabilityStatusCommand(BaseModel):
    """Command to set the current operator availability. Unavailable
    operators will not get emergencies assigned to them."""

    command: Literal[MessageCommand.SET_AVAILABILITY] = MessageCommand.SET_AVAILABILITY
    payload: bool


class AnnounceArrivalCommand(BaseModel):
    """Command for paramedic to announce arrival at emergency site.

    This command has no payload as the emergency ID is extracted from
    the connection context."""

    command: Literal[MessageCommand.ARRIVE] = MessageCommand.ARRIVE
    payload: None = None

    def to_domain(self, emergencyId: uuid.UUID) -> CoreAnnounceArrivalCommand:
        return CoreAnnounceArrivalCommand(emergencyId=emergencyId)


operatorCommand = Union[
    TriageEmergencyCommand,
    RequestEmergencyAssignmentCommand,
    SubscribeToEmergencyCommand,
    SetOperatorAvailabilityStatusCommand,
]

operatorCommands: List[type[operatorCommand]] = [
    TriageEmergencyCommand,
    RequestEmergencyAssignmentCommand,
    SubscribeToEmergencyCommand,
    SetOperatorAvailabilityStatusCommand,
]

paramedicCommand = AnnounceArrivalCommand

paramedicCommands: List[type[paramedicCommand]] = [
    AnnounceArrivalCommand,
]


def parse_paramedic_command(message: Dict) -> paramedicCommand:
    for commandClass in paramedicCommands:
        try:
            return commandClass.model_validate(message)
        except ValidationError as e:
            logging.debug(e)
            continue
    raise InvalidCommandException


class InvalidCommandException(Exception):
    pass


def parse_operator_command(message: Dict) -> operatorCommand:
    for commandClass in operatorCommands:
        try:
            return commandClass.model_validate(message)
        except ValidationError as e:
            logging.debug(e)
            continue
    raise InvalidCommandException


class EmergencyReceivedEvent(BaseModel):
    event: Literal[MessageEvent.RECEIVED]
    payload: Emergency


class UserGreetEvent(BaseModel):
    """Send a greeting  to a user with context of the emergency. This
    is probably a bad name but I'm a programmer so that's to be
    expected."""

    event: Literal[MessageEvent.GREETING]
    payload: Emergency


class EmergencyTriagedEvent(BaseModel):
    event: Literal[MessageEvent.TRIAGED]
    payload: Emergency


class EmergencyAssignedEvent(BaseModel):
    event: Literal[MessageEvent.ASSIGNED]
    payload: Emergency


class EmergencyArrivedEvent(BaseModel):
    event: Literal[MessageEvent.ARRIVED]
    payload: Emergency


class ErrorEvent(BaseModel):
    event: Literal[MessageEvent.ERROR] = MessageEvent.ERROR
    payload: str
