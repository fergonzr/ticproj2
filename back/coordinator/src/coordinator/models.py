"""Models used to communicate events and commands to and from clients"""

import enum
import logging
import uuid
from typing import Dict, List, Literal, Union

from core.application.use_cases import DefaultedRequest
from core.application.use_cases.announce_arrival import (
    AnnounceArrivalToEmergencyCommand as CoreAnnounceArrivalCommand,
)
from core.application.use_cases.assign_complexity_level_to_emergency import (
    AssignComplexityLevelToEmergencyCommand as CoreAssignComplexityLevelCommand,
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
from core.domain.entities.medical_center import ComplexityLevel
from core.domain.value_objects.alert import Alert
from pydantic import BaseModel, ValidationError

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


class SafeParamedic(BaseModel):
    """Safe representation of a paramedic that excludes sensitive information.

    This model is used for WebSocket communications to prevent exposing
    sensitive data like password hashes and personal email addresses."""

    id: uuid.UUID
    name: str
    userRole: str


class SafeEmergency(BaseModel):
    """Safe representation of an emergency that excludes sensitive information.

    This model is used for WebSocket communications to prevent exposing
    sensitive data from the assigned paramedic."""

    id: uuid.UUID
    alert: Alert
    assignedTo: SafeParamedic | None = None
    status: str
    triage: dict | None = None
    complexityLevel: ComplexityLevel | None
    timeline: dict

    @classmethod
    def from_domain(cls, emergency: Emergency) -> "SafeEmergency":
        """Convert a domain Emergency entity to a safe representation."""
        safe_assigned_to = None
        if emergency.assignedTo is not None:
            safe_assigned_to = SafeParamedic(
                id=emergency.assignedTo.id,
                name=emergency.assignedTo.name,
                userRole=emergency.assignedTo.userRole.value,
            )

        # Convert triage to dict if it exists
        triage_dict = None
        if emergency.triage is not None:
            triage_dict = {
                "bleeding": emergency.triage.bleeding,
                "dizziness": emergency.triage.dizziness,
                "blurred_vision": emergency.triage.blurred_vision,
                "unconscious": emergency.triage.unconscious,
                "difficulty_breathing": emergency.triage.difficulty_breathing,
                "fracture": emergency.triage.fracture,
                "chest_pain": emergency.triage.chest_pain,
                "numbness_limbs": emergency.triage.numbness_limbs,
            }

        return cls(
            id=emergency.id,
            alert=emergency.alert,
            assignedTo=safe_assigned_to,
            status=emergency.status.value,
            triage=triage_dict,
            complexityLevel=emergency.complexityLevel,
            timeline={k.value: v for k, v in emergency.timeline.items()},
        )


class MessageCommand(str, enum.Enum):
    REPORT = "REPORT_EMERGENCY"
    TRIAGE = "TRIAGE_EMERGENCY"
    REQUEST_ASSIGN = "REQUEST_EMERGENCY_ASSIGNMENT"
    SET_AVAILABILITY = "SET_AVAILABILITY"
    SUBSCRIBE = "SUBSCRIBE"
    ARRIVE = "ANNOUNCE_ARRIVAL"
    ASSIGN_COMPLEXITY = "ASSIGN_COMPLEXITY_LEVEL"


class MessageEvent(enum.Enum):
    GREETING = "USER_GREET"
    RECEIVED = "EMERGENCY_RECEIVED"
    TRIAGED = "EMERGENCY_TRIAGED"
    ASSIGNED = "EMERGENCY_ASSIGNED"
    ARRIVED = "EMERGENCY_ARRIVED"
    COMPLEXITY_ASSIGNED = "EMERGENCY_COMPLEXITY_ASSIGNED"
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


class AssignComplexityLevelCommand(BaseModel):
    """Command for paramedic to assign complexity level to an emergency.

    This command has no payload as the emergency ID is extracted from
    the connection context and the complexity level is provided directly."""

    command: Literal[MessageCommand.ASSIGN_COMPLEXITY] = (
        MessageCommand.ASSIGN_COMPLEXITY
    )
    payload: int  # Complexity level value (0=BASIC, 1=INTERMEDIATE, 2=HIGH)

    def to_domain(self, emergencyId: uuid.UUID) -> CoreAssignComplexityLevelCommand:
        from core.domain.entities.medical_center import ComplexityLevel

        return CoreAssignComplexityLevelCommand(
            emergencyId=emergencyId, complexityLevel=ComplexityLevel(self.payload)
        )


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

paramedicCommand = Union[AnnounceArrivalCommand, AssignComplexityLevelCommand]

paramedicCommands: List[type[paramedicCommand]] = [
    AnnounceArrivalCommand,
    AssignComplexityLevelCommand,
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
    payload: SafeEmergency


class UserGreetEvent(BaseModel):
    """Send a greeting  to a user with context of the emergency. This
    is probably a bad name but I'm a programmer so that's to be
    expected."""

    event: Literal[MessageEvent.GREETING]
    payload: SafeEmergency


class EmergencyTriagedEvent(BaseModel):
    event: Literal[MessageEvent.TRIAGED]
    payload: SafeEmergency


class EmergencyAssignedEvent(BaseModel):
    event: Literal[MessageEvent.ASSIGNED]
    payload: SafeEmergency


class EmergencyArrivedEvent(BaseModel):
    event: Literal[MessageEvent.ARRIVED]
    payload: SafeEmergency


class EmergencyComplexityAssignedEvent(BaseModel):
    event: Literal[MessageEvent.COMPLEXITY_ASSIGNED]
    payload: SafeEmergency


class ErrorEvent(BaseModel):
    event: Literal[MessageEvent.ERROR] = MessageEvent.ERROR
    payload: str
