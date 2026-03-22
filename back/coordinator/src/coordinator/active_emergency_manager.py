from datetime import datetime

from core.domain.entities import Emergency
from core.domain.entities.emergency import EmergencyStatus
from core.domain.entities.user import Paramedic
from fastapi.websockets import WebSocket

from coordinator.models import (
    EmergencyAssignedEvent,
    EmergencyReceivedEvent,
    EmergencyTriagedEvent,
    MessageEvent,
    UserGreetEvent,
)


class ActiveEmergencyCoordinator:
    """A class that coordinates the management of a single active
    emergency"""

    _citizenConnection: WebSocket | None = None
    _operatorConnection: WebSocket | None = None
    _paramedicConnection: WebSocket | None = None
    emergency: Emergency

    def __init__(self, emergency):
        self.emergency = emergency

    async def report(self, emergency: Emergency):
        self.emergency = emergency
        self._emergencyId = emergency.timeline[EmergencyStatus.RECEIVED]
        if self._operatorConnection:
            await self._operatorConnection.send_text(
                EmergencyReceivedEvent(
                    event=MessageEvent.RECEIVED, payload=emergency
                ).model_dump_json()
            )
        if self._citizenConnection:
            await self._citizenConnection.send_text(
                EmergencyReceivedEvent(
                    event=MessageEvent.RECEIVED, payload=emergency
                ).model_dump_json()
            )

    async def report_assignment(self, emergency: Emergency, paramedic: Paramedic):
        self.emergency = emergency
        eventText = EmergencyAssignedEvent(
            event=MessageEvent.ASSIGNED, payload=emergency
        ).model_dump_json()
        for connection in (
            self._operatorConnection,
            self._citizenConnection,
            self._paramedicConnection,
        ):
            if connection:
                await connection.send_text(eventText)

    async def report_triage(self, emergency: Emergency):
        self.emergency = emergency
        if self._citizenConnection:
            await self._citizenConnection.send_text(
                EmergencyTriagedEvent(
                    event=MessageEvent.TRIAGED, payload=emergency
                ).model_dump_json()
            )

    async def add_operator_connection(self, operatorConnection: WebSocket, greet=True):
        self._operatorConnection = operatorConnection
        if greet:
            await self._operatorConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING, payload=self.emergency
                ).model_dump_json()
            )

    async def add_citizen_connection(self, citizenConnection: WebSocket, greet=True):
        self._citizenConnection = citizenConnection
        if greet:
            await self._citizenConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING, payload=self.emergency
                ).model_dump_json()
            )

    async def add_paramedic_connection(
        self, paramedicConnection: WebSocket, greet=True
    ):
        self._paramedicConnection = paramedicConnection
        if greet:
            await self._paramedicConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING, payload=self.emergency
                ).model_dump_json()
            )
