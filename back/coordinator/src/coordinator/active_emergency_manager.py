from core.domain.entities import Emergency
from core.domain.entities.user import Paramedic
from fastapi.websockets import WebSocket, WebSocketState

from coordinator.models import (
    EmergencyArrivedEvent,
    EmergencyAssignedEvent,
    EmergencyClosedEvent,
    EmergencyComplexityAssignedEvent,
    EmergencyReceivedEvent,
    EmergencyResolvedEvent,
    EmergencyTransferredEvent,
    EmergencyTriagedEvent,
    MessageEvent,
    SafeEmergency,
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

    def _check_connections(self):
        """Check that all the current connections are active, and
        update those that are not."""
        if (
            self._citizenConnection is not None
            and self._citizenConnection.client_state != WebSocketState.CONNECTED
        ):
            self._citizenConnection = None
        if (
            self._operatorConnection is not None
            and self._operatorConnection.client_state != WebSocketState.CONNECTED
        ):
            self._operatorConnection = None
        if (
            self._paramedicConnection is not None
            and self._paramedicConnection.client_state != WebSocketState.CONNECTED
        ):
            self._paramedicConnection = None

    async def report(self, emergency: Emergency):
        self._check_connections()
        self.emergency = emergency
        self._emergencyId = emergency.id
        safe_emergency = SafeEmergency.from_domain(emergency)
        if self._operatorConnection:
            await self._operatorConnection.send_text(
                EmergencyReceivedEvent(
                    event=MessageEvent.RECEIVED, payload=safe_emergency
                ).model_dump_json()
            )
        if self._citizenConnection:
            await self._citizenConnection.send_text(
                EmergencyReceivedEvent(
                    event=MessageEvent.RECEIVED, payload=safe_emergency
                ).model_dump_json()
            )

    async def report_assignment(self, emergency: Emergency, paramedic: Paramedic):
        self._check_connections()
        self.emergency = emergency
        safe_emergency = SafeEmergency.from_domain(emergency)
        eventText = EmergencyAssignedEvent(
            event=MessageEvent.ASSIGNED, payload=safe_emergency
        ).model_dump_json()
        for connection in (
            self._operatorConnection,
            self._citizenConnection,
            self._paramedicConnection,
        ):
            if connection:
                await connection.send_text(eventText)

    async def report_triage(self, emergency: Emergency):
        self._check_connections()
        self.emergency = emergency
        safe_emergency = SafeEmergency.from_domain(emergency)
        if self._citizenConnection:
            await self._citizenConnection.send_text(
                EmergencyTriagedEvent(
                    event=MessageEvent.TRIAGED, payload=safe_emergency
                ).model_dump_json()
            )
        if self._operatorConnection:
            await self._operatorConnection.send_text(
                EmergencyTriagedEvent(
                    event=MessageEvent.TRIAGED, payload=safe_emergency
                ).model_dump_json()
            )

    async def add_operator_connection(self, operatorConnection: WebSocket, greet=True):
        self._operatorConnection = operatorConnection
        if greet:
            safe_emergency = SafeEmergency.from_domain(self.emergency)
            await self._operatorConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING_EMERGENCY, payload=safe_emergency
                ).model_dump_json()
            )

    async def add_citizen_connection(self, citizenConnection: WebSocket, greet=True):
        self._citizenConnection = citizenConnection
        if greet:
            safe_emergency = SafeEmergency.from_domain(self.emergency)
            await self._citizenConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING_EMERGENCY, payload=safe_emergency
                ).model_dump_json()
            )

    async def add_paramedic_connection(
        self, paramedicConnection: WebSocket, greet=True
    ):
        self._paramedicConnection = paramedicConnection
        if greet:
            safe_emergency = SafeEmergency.from_domain(self.emergency)
            await self._paramedicConnection.send_text(
                UserGreetEvent(
                    event=MessageEvent.GREETING_EMERGENCY, payload=safe_emergency
                ).model_dump_json()
            )

    async def report_arrival(self, emergency: Emergency):
        self._check_connections()
        self.emergency = emergency
        safe_emergency = SafeEmergency.from_domain(emergency)
        eventText = EmergencyArrivedEvent(
            event=MessageEvent.ARRIVED, payload=safe_emergency
        ).model_dump_json()
        for connection in (
            self._operatorConnection,
            self._citizenConnection,
            self._paramedicConnection,
        ):
            if connection:
                await connection.send_text(eventText)

    async def report_transfer(self, emergency: Emergency):
        self._check_connections()
        self.emergency = emergency
        safe_emergency = SafeEmergency.from_domain(emergency)
        eventText = EmergencyTransferredEvent(
            event=MessageEvent.TRANSFERRED, payload=safe_emergency
        ).model_dump_json()
        for connection in (
            self._operatorConnection,
            self._citizenConnection,
            self._paramedicConnection,
        ):
            if connection:
                await connection.send_text(eventText)

    async def report_resolution(self, emergency: Emergency):
        self._check_connections()
        self.emergency = emergency
        safe_emergency = SafeEmergency.from_domain(emergency)
        eventText = EmergencyResolvedEvent(
            event=MessageEvent.RESOLVED, payload=safe_emergency
        ).model_dump_json()
        for connection in (
            self._operatorConnection,
            self._citizenConnection,
            self._paramedicConnection,
        ):
            if connection:
                await connection.send_text(eventText)

    async def report_closing(self, emergency: Emergency):
        self._check_connections()
        self.emergency = emergency
        safe_emergency = SafeEmergency.from_domain(emergency)
        eventText = EmergencyClosedEvent(
            event=MessageEvent.CLOSED, payload=safe_emergency
        ).model_dump_json()
        for connection in (
            self._operatorConnection,
            self._citizenConnection,
            self._paramedicConnection,
        ):
            if connection:
                await connection.send_text(eventText)

    async def report_complexity_assignment(self, emergency: Emergency):
        self._check_connections()
        self.emergency = emergency
        safe_emergency = SafeEmergency.from_domain(emergency)
        eventText = EmergencyComplexityAssignedEvent(
            event=MessageEvent.COMPLEXITY_ASSIGNED, payload=safe_emergency
        ).model_dump_json()
        for connection in (
            self._operatorConnection,
            self._citizenConnection,
            self._paramedicConnection,
        ):
            if connection:
                await connection.send_text(eventText)
