from datetime import datetime

from core.domain.entities import Emergency
from core.domain.entities.emergency import EmergencyStatus
from fastapi.websockets import WebSocket

from coordinator.models import (
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
    _emergency: Emergency

    def __init__(self, emergency):
        self._emergency = emergency

    async def report(self, emergency: Emergency):
        self._emergency = emergency
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

    async def report_triage(self, emergency: Emergency):
        self._emergency = emergency
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
                    event=MessageEvent.GREETING, payload=self._emergency
                ).model_dump_json()
            )

    async def add_citizen_connection(self, citizenConnection: WebSocket, greet=True):
        self._citizenConnection = citizenConnection
        if greet:
            await self._citizenConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING, payload=self._emergency
                ).model_dump_json()
            )

    async def add_paramedic_connection(self, operatorConnection: WebSocket, greet=True):
        self._paramedicConnection = operatorConnection
        if greet:
            self._paramedicConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING, payload=self._emergency
                ).model_dump_json()
            )
