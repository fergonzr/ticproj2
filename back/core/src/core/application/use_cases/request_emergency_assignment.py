import uuid
from typing import Dict

import cqrs
from pydantic import BaseModel
from typing_extensions import ClassVar

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedNotificationEvent, DefaultedRequest
from core.domain.entities.emergency import (
    Emergency,
    EmergencyNotFoundError,
    EmergencyStatus,
    InvalidEmergencyStateTransitionException,
)
from core.domain.entities.user import UserNotFoundError
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.triage import Triage


class RequestEmergencyAssignmentCommand(DefaultedRequest):
    """Command for assigning an emergency to a paramedic"""

    paramedicId: uuid.UUID
    emergencyId: uuid.UUID


class RequestEmergencyAssignmentEventPayload(BaseModel):
    paramedicId: uuid.UUID
    emergencyId: uuid.UUID


class RequestEmergencyAssignmentEvent(DefaultedNotificationEvent):
    name = "request_emergency_assignment"
    topic = "emergency_assignment"
    payloadModel = RequestEmergencyAssignmentEventPayload


class RequestEmergencyAssignmentHandler(
    cqrs.RequestHandler[RequestEmergencyAssignmentCommand, None]
):
    def __init__(
        self,
        storage: RealTimeStoragePort,
    ):
        """Initialize the handler with a reference to a ParamedicLocationUpdaterPort"""

        self._events = []
        self.storage = storage

    @property
    def events(self):
        return self._events

    async def handle(self, request: RequestEmergencyAssignmentCommand) -> None:
        """Handle the request of an assignment by passing it to the
        ParamedicLocationUpdaterPort"""

        emergency = await self.storage.get_emergency(request.emergencyId)
        paramedic = await self.storage.get_paramedic(request.paramedicId)

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        if (
            paramedic is None
            or paramedic.resource is None
            or paramedic.assignedEmergencyId is not None
        ):
            raise UserNotFoundError(request.paramedicId)

        if emergency.status != EmergencyStatus.TRIAGED or emergency.triage is None:
            raise InvalidEmergencyStateTransitionException

        self._events.append(
            cqrs.NotificationEvent(
                event_name=RequestEmergencyAssignmentEvent.name,
                topic=RequestEmergencyAssignmentEvent.topic,
                payload=RequestEmergencyAssignmentEventPayload(
                    paramedicId=request.paramedicId, emergencyId=emergency.id
                ),
            )
        )


RequestEmergencyAssignmentCommand.defaultHandler = RequestEmergencyAssignmentHandler
