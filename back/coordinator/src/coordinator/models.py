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
from core.application.use_cases.cancel_emergency import (
    CancelEmergencyCommand as CoreCancelEmergencyCommand,
)
from core.application.use_cases.cancel_emergency_assignment import (
    CancelEmergencyAssignmentCommand as CoreCancelEmergencyAssignmentCommand,
)
from core.application.use_cases.close_emergency import (
    CloseEmergencyCommand as CoreCloseEmergencyCommand,
)
from core.application.use_cases.edit_alert import (
    EditAlertCommand as CoreEditAlertCommand,
)
from core.application.use_cases.mark_emergency_as_resolved import (
    MarkEmergencyAsResolvedCommand as CoreMarkEmergencyAsResolvedCommand,
)
from core.application.use_cases.report_emergency import (
    ReportEmergencyCommand as CoreReportEmergencyCommand,
)
from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentCommand as CoreRequestEmergencyAssignmentCommand,
)
from core.application.use_cases.transfer_emergency_to_medical_center import (
    TransferEmergencyToMedicalCenterCommand as CoreTransferEmergencyCommand,
)
from core.application.use_cases.triage_emergency import (
    TriageEmergencyCommand as CoreTriageEmergencyCommand,
)
from core.domain.entities import Emergency
from core.domain.entities.medical_center import ComplexityLevel, MedicalCenterInfo
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
    filingNumber: int
    assignedTo: SafeParamedic | None = None
    status: str
    triage: dict | None = None
    complexityLevel: ComplexityLevel | None
    transferedTo: MedicalCenterInfo | None
    cancelReason: str | None
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
            filingNumber=emergency.filingNumber,
            alert=emergency.alert,
            assignedTo=safe_assigned_to,
            status=emergency.status.value,
            triage=triage_dict,
            complexityLevel=emergency.complexityLevel,
            transferedTo=emergency.transferedTo,
            cancelReason=emergency.cancelReason,
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
    TRANSFER = "TRANSFER_EMERGENCY"
    MARK_RESOLVED = "MARK_EMERGENCY_RESOLVED"
    CLOSE = "CLOSE_EMERGENCY"
    CANCEL = "CANCEL_EMERGENCY"
    CANCEL_ASSIGNMENT = "CANCEL_ASSIGNMENT"
    EDIT_ALERT = "EDIT_ALERT"


class MessageEvent(enum.Enum):
    # Greet a user to being associated with an emergency
    GREETING_EMERGENCY = "USER_GREET_EMERGENCY"
    # Greet a user to the system in general
    GREETING = "USER_GREET"
    TAKEN = "EMERGENCY_TAKEN"
    RECEIVED = "EMERGENCY_RECEIVED"
    TRIAGED = "EMERGENCY_TRIAGED"
    ASSIGNED = "EMERGENCY_ASSIGNED"
    ARRIVED = "EMERGENCY_ARRIVED"
    COMPLEXITY_ASSIGNED = "EMERGENCY_COMPLEXITY_ASSIGNED"
    TRANSFERRED = "EMERGENCY_TRANSFERRED"
    RESOLVED = "EMERGENCY_RESOLVED"
    CLOSED = "EMERGENCY_CLOSED"
    ERROR = "ERROR"
    ALERT_EDITED = "ALERT_EDITED"
    CANCELED = "EMERGENCY_CANCELED"
    ASSIGNMENT_CANCELED = "EMERGENCY_ASSIGNMENT_CANCELED"


class SubscribeToEmergencyCommand(BaseModel):
    """A command for the operator or citizen to subscribe to events
    related to an already reported emergency.

    Attributes:
        command: A literal MessageCommand.SUBSCRIBE.
        payload: The emergency id to subscribe to.
    """

    command: Literal[MessageCommand.SUBSCRIBE] = MessageCommand.SUBSCRIBE
    payload: uuid.UUID


class CancelEmergencyPayload(BaseModel):
    emergencyId: uuid.UUID
    reason: str | None = None


class CitizenCancelEmergencyCommand(BaseModel):
    command: Literal[MessageCommand.CANCEL]
    payload: CancelEmergencyPayload

    def to_domain(self) -> CoreCancelEmergencyCommand:
        return CoreCancelEmergencyCommand(
            byCitizen=True,
            reason=self.payload.reason,
            emergencyId=self.payload.emergencyId,
        )


class BaseOperatorBusinessCommand(BaseModel):
    """Base class for all commands that can be issued by an operator
    and have an effect on the business state"""

    def to_domain(self) -> DefaultedRequest:
        raise NotImplementedError


class ReportEmergencyCommand(BaseOperatorBusinessCommand):
    command: Literal[MessageCommand.REPORT]
    payload: Alert

    def to_domain(self) -> CoreReportEmergencyCommand:
        return CoreReportEmergencyCommand(alert=self.payload)


class TriageEmergencyCommand(BaseOperatorBusinessCommand):
    command: Literal[MessageCommand.TRIAGE]
    payload: CoreTriageEmergencyCommand

    def to_domain(self) -> CoreTriageEmergencyCommand:
        return self.payload


class StrictCancelEmergencyPayload(BaseModel):
    emergencyId: uuid.UUID
    reason: str


class OperatorCancelEmergencyCommand(BaseOperatorBusinessCommand):
    command: Literal[MessageCommand.CANCEL]
    payload: StrictCancelEmergencyPayload

    def to_domain(self) -> CoreCancelEmergencyCommand:
        return CoreCancelEmergencyCommand(
            byCitizen=False,
            reason=self.payload.reason,
            emergencyId=self.payload.emergencyId,
        )


class EditAlertCommand(BaseOperatorBusinessCommand):
    command: Literal[MessageCommand.EDIT_ALERT]
    payload: CoreEditAlertCommand

    def to_domain(self) -> CoreEditAlertCommand:
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


class CancelAssignmentPayload(BaseModel):
    """Payload to cancel the assignment of the current emergency"""

    reason: str


class CancelAssignmentCommand(BaseModel):
    """Command to cancel the assignment of the current emergency"""

    command: Literal[MessageCommand.CANCEL_ASSIGNMENT] = (
        MessageCommand.CANCEL_ASSIGNMENT
    )
    # None - the emergency Id is taken from context
    payload: CancelAssignmentPayload

    def to_domain(self, emergencyId: uuid.UUID) -> CoreCancelEmergencyAssignmentCommand:
        return CoreCancelEmergencyAssignmentCommand(
            emergencyId=emergencyId, reason=self.payload.reason
        )


class TransferEmergencyCommand(BaseModel):
    """Command for paramedic to transfer an emergency to a medical center.

    This command requires the medical center ID as payload. The emergency ID
    is extracted from the connection context."""

    command: Literal[MessageCommand.TRANSFER] = MessageCommand.TRANSFER
    payload: uuid.UUID  # Medical center ID

    def to_domain(self, emergencyId: uuid.UUID) -> CoreTransferEmergencyCommand:
        return CoreTransferEmergencyCommand(
            emergencyId=emergencyId, medicalCenterId=self.payload
        )


class AnnounceArrivalCommand(BaseModel):
    """Command for paramedic to announce arrival at emergency site.

    This command has no payload as the emergency ID is extracted from
    the connection context."""

    command: Literal[MessageCommand.ARRIVE] = MessageCommand.ARRIVE
    payload: None = None

    def to_domain(self, emergencyId: uuid.UUID) -> CoreAnnounceArrivalCommand:
        return CoreAnnounceArrivalCommand(emergencyId=emergencyId)


class MarkEmergencyAsResolvedCommand(BaseModel):
    """Command for paramedic to mark an emergency as resolved.

    This command has no payload as the emergency ID is extracted from
    the connection context."""

    command: Literal[MessageCommand.MARK_RESOLVED] = MessageCommand.MARK_RESOLVED
    payload: None = None

    def to_domain(self, emergencyId: uuid.UUID) -> CoreMarkEmergencyAsResolvedCommand:
        return CoreMarkEmergencyAsResolvedCommand(emergencyId=emergencyId)


class CloseEmergencyCommand(BaseOperatorBusinessCommand):
    """Command for operator to close a resolved emergency."""

    command: Literal[MessageCommand.CLOSE] = MessageCommand.CLOSE
    payload: uuid.UUID  # The uuid of the emergency

    def to_domain(self) -> CoreCloseEmergencyCommand:
        return CoreCloseEmergencyCommand(emergencyId=self.payload)


citizenCommand = Union[
    ReportEmergencyCommand, SubscribeToEmergencyCommand, CitizenCancelEmergencyCommand
]
citizenCommands: List[type[citizenCommand]] = [
    ReportEmergencyCommand,
    SubscribeToEmergencyCommand,
    CitizenCancelEmergencyCommand,
]


operatorCommand = Union[
    ReportEmergencyCommand,
    TriageEmergencyCommand,
    RequestEmergencyAssignmentCommand,
    SubscribeToEmergencyCommand,
    SetOperatorAvailabilityStatusCommand,
    CloseEmergencyCommand,
    OperatorCancelEmergencyCommand,
    EditAlertCommand,
]

operatorCommands: List[type[operatorCommand]] = [
    ReportEmergencyCommand,
    TriageEmergencyCommand,
    RequestEmergencyAssignmentCommand,
    SubscribeToEmergencyCommand,
    CloseEmergencyCommand,
    SetOperatorAvailabilityStatusCommand,
    OperatorCancelEmergencyCommand,
    EditAlertCommand,
]


paramedicCommand = Union[
    AnnounceArrivalCommand,
    AssignComplexityLevelCommand,
    TransferEmergencyCommand,
    MarkEmergencyAsResolvedCommand,
    CancelAssignmentCommand,
]

paramedicCommands: List[type[paramedicCommand]] = [
    AnnounceArrivalCommand,
    AssignComplexityLevelCommand,
    TransferEmergencyCommand,
    MarkEmergencyAsResolvedCommand,
    CancelAssignmentCommand,
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


def parse_citizen_command(message: dict) -> citizenCommand:
    for commandClass in citizenCommands:
        try:
            return commandClass.model_validate(message)
        except ValidationError as e:
            logger.info(e)
            continue
    raise InvalidCommandException


class EmergencyReceivedEvent(BaseModel):
    event: Literal[MessageEvent.RECEIVED] = MessageEvent.RECEIVED
    payload: SafeEmergency


class EmergencyTakenEvent(BaseModel):
    """An event that represents that the emergency with the given id
    is now being managed by another operator."""

    event: Literal[MessageEvent.TAKEN]
    payload: uuid.UUID


class UserGreetEvent(BaseModel):
    """Send a greeting  to a user with context of the emergency. This
    is probably a bad name but I'm a programmer so that's to be
    expected."""

    event: Literal[MessageEvent.GREETING_EMERGENCY]
    payload: SafeEmergency


class UserGreetToSystemEvent(BaseModel):
    event: Literal[MessageEvent.GREETING]
    payload: SafeEmergency


class EmergencyTriagedEvent(BaseModel):
    event: Literal[MessageEvent.TRIAGED] = MessageEvent.TRIAGED
    payload: SafeEmergency


class EmergencyAssignedEvent(BaseModel):
    event: Literal[MessageEvent.ASSIGNED] = MessageEvent.ASSIGNED
    payload: SafeEmergency


class EmergencyArrivedEvent(BaseModel):
    event: Literal[MessageEvent.ARRIVED] = MessageEvent.ARRIVED
    payload: SafeEmergency


class EmergencyComplexityAssignedEvent(BaseModel):
    event: Literal[MessageEvent.COMPLEXITY_ASSIGNED] = MessageEvent.COMPLEXITY_ASSIGNED
    payload: SafeEmergency


class EmergencyTransferredEvent(BaseModel):
    event: Literal[MessageEvent.TRANSFERRED] = MessageEvent.TRANSFERRED
    payload: SafeEmergency


class EmergencyResolvedEvent(BaseModel):
    event: Literal[MessageEvent.RESOLVED] = MessageEvent.RESOLVED
    payload: SafeEmergency


class EmergencyClosedEvent(BaseModel):
    event: Literal[MessageEvent.CLOSED] = MessageEvent.CLOSED
    payload: SafeEmergency


class EmergencyAlertEditedEvent(BaseModel):
    event: Literal[MessageEvent.ALERT_EDITED] = MessageEvent.ALERT_EDITED
    payload: SafeEmergency


class EmergencyCanceledEvent(BaseModel):
    event: Literal[MessageEvent.CANCELED] = MessageEvent.CANCELED
    payload: SafeEmergency


class EmergencyAssignmentCanceledEvent(BaseModel):
    event: Literal[MessageEvent.ASSIGNMENT_CANCELED] = MessageEvent.ASSIGNMENT_CANCELED
    payload: SafeEmergency


EmergencyUpdateEvent = Union[
    EmergencyReceivedEvent,
    EmergencyTriagedEvent,
    EmergencyAssignedEvent,
    EmergencyArrivedEvent,
    EmergencyComplexityAssignedEvent,
    EmergencyTransferredEvent,
    EmergencyResolvedEvent,
    EmergencyAlertEditedEvent,
    EmergencyCanceledEvent,
    EmergencyClosedEvent,
    EmergencyAssignmentCanceledEvent,
]


class ErrorEvent(BaseModel):
    event: Literal[MessageEvent.ERROR] = MessageEvent.ERROR
    payload: str
