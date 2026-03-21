from datetime import datetime

from core.domain.entities import Emergency
from core.domain.entities.emergency import EmergencyStatus
from fastapi.websockets import WebSocket

from coordinator.models import (
    EmergencyReceivedEvent,
    EmergencyTriagedEvent,
    MessageEvent,
)


class ActiveEmergencyCoordinator:
    """A class that coordinates the management of a single active
    emergency"""

    _citizenConnection: WebSocket
    operatorConnection: WebSocket | None = None
    _paramedicConnection: WebSocket | None = None
    _emergencyId: datetime

    def __init__(self, citizenConnection: WebSocket):
        self._citizenConnection = citizenConnection

    async def report(self, emergency: Emergency):
        self._emergencyId = emergency.timeline[EmergencyStatus.RECEIVED]
        if self.operatorConnection:
            await self.operatorConnection.send_text(
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
        await self._citizenConnection.send_text(
            EmergencyTriagedEvent(
                event=MessageEvent.TRIAGED, payload=emergency
            ).model_dump_json()
        )
