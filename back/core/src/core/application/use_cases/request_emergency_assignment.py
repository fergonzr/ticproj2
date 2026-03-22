import uuid

import cqrs
from pydantic import BaseModel
from typing_extensions import ClassVar

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases import DefaultedNotificationEvent, DefaultedRequest
from core.domain.entities.emergency import EmergencyNotFoundError


class RequestEmergencyAssignmentCommand(DefaultedRequest):
    """Command for assigning an emergency to a paramedic"""

    paramedicId: uuid.UUID
    emergencyId: uuid.UUID
    """The URL that the paramedic must connect to in order to confirm
    the assignment of the emergency"""
    confirmationURL: str


class RequestEmergencyAssignmentEventPayload(BaseModel):
    paramedicId: uuid.UUID
    emergencyId: uuid.UUID
    confirmationURL: str


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

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        self._events.append(
            cqrs.NotificationEvent(
                event_name=RequestEmergencyAssignmentEvent.name,
                topic=RequestEmergencyAssignmentEvent.topic,
                payload=RequestEmergencyAssignmentEventPayload(
                    paramedicId=request.paramedicId,
                    emergencyId=emergency.id,
                    confirmationURL=request.confirmationURL,
                ),
            )
        )


RequestEmergencyAssignmentCommand.defaultHandler = RequestEmergencyAssignmentHandler
