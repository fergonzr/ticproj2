"""Models used to communicate events and commands to and from clients"""

import enum
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Union

from core.application.use_cases import DefaultedRequest
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
from core.domain.value_objects.triage import Triage
from pydantic import BaseModel, Field, ValidationError

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


class MessageEvent(enum.Enum):
    GREETING = "USER_GREET"
    RECEIVED = "EMERGENCY_RECEIVED"
    TRIAGED = "EMERGENCY_TRIAGED"
    ASSIGNED = "EMERGENCY_ASSIGNED"
    ERROR = "ERROR"


class ReportEmergencyCommand(BaseModel):
    command: Literal[MessageCommand.REPORT]
    payload: Alert

    def to_domain(self) -> CoreReportEmergencyCommand:
        return CoreReportEmergencyCommand(alert=self.payload)


class OperatorCommand(BaseModel):
    """Base class for all commands that can be issued by an operator"""

    def to_domain(self) -> DefaultedRequest:
        raise NotImplementedError


class TriageEmergencyCommand(OperatorCommand):
    command: Literal[MessageCommand.TRIAGE]
    payload: CoreTriageEmergencyCommand

    def to_domain(self) -> CoreTriageEmergencyCommand:
        return self.payload


class RequestEmergencyAssignmentPayload(BaseModel):
    emergencyId: uuid.UUID
    paramedicId: uuid.UUID


class RequestEmergencyAssignmentCommand(OperatorCommand):
    command: Literal[MessageCommand.REQUEST_ASSIGN]
    payload: RequestEmergencyAssignmentPayload

    def to_domain(self) -> CoreRequestEmergencyAssignmentCommand:
        return CoreRequestEmergencyAssignmentCommand(
            emergencyId=self.payload.emergencyId,
            paramedicId=self.payload.paramedicId,
            confirmationURL=f"/api/v1/coordination/paramedic/{self.payload.emergencyId}",
        )


operatorCommands: List[type[OperatorCommand]] = [
    TriageEmergencyCommand,
    RequestEmergencyAssignmentCommand,
]


class InvalidCommandException(Exception):
    pass


def operator_command_to_domain(message: Dict) -> DefaultedRequest:
    for commandClass in operatorCommands:
        try:
            return commandClass.model_validate(message).to_domain()
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


class ErrorEvent(BaseModel):
    event: Literal[MessageEvent.ERROR] = MessageEvent.ERROR
    payload: str
