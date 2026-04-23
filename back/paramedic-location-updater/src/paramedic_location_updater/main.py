import logging
import uuid
from datetime import datetime
from typing import Dict, List, Set

import cqrs
from core.application.factories import create_mediator
from core.application.ports.event_binder import NotificationEventBinderPort
from core.application.use_cases.activate_paramedic import (
    ActivateParamedicCommand,
    UserRole,
)
from core.application.use_cases.delete_paramedic import DeleteParamedicFromRTDbCommand
from core.application.use_cases.get_emergency_by_id import GetEmergencyByIdQuery
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.application.use_cases.report_emergency import ReportEmergencyCommand
from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentCommand,
    RequestEmergencyAssignmentEvent,
    RequestEmergencyAssignmentEventPayload,
)
from core.application.use_cases.update_paramedic_loc import (
    UpdateParamedicLocationCommand,
)
from core.domain.entities.emergency import Alert, Emergency, EmergencyStatus
from core.domain.entities.user import UserNotFoundError
from core.domain.value_objects.location import Location
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.applications import FastAPI
from fastapi.websockets import WebSocketState
from sie_auth import get_user_in_token

from .models import (
    EmergencyAssignmentRequestedEvent,
    ErrorEvent,
    InvalidCommandException,
    LocationUpdatedPayload,
    Message,
    MessageCommand,
    MessageEvent,
    ParamedicLocationUpdatedEvent,
    UpdateLocationPayload,
    parse_subscription_state_command,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)
app = FastAPI()


class UnallocatedParamedicConnectionManager:
    activeConnections: Dict[uuid.UUID, WebSocket]
    subscribers: Dict[uuid.UUID, Set[WebSocket]]

    def __init__(self, binder: NotificationEventBinderPort):
        self.activeConnections = {}
        self._binder = binder
        self.is_ready = False
        self.subscribers = {}

    async def connect(
        self,
        websocket: WebSocket,
        paramedicId: uuid.UUID,
        mediator: cqrs.RequestMediator,
    ):
        """Add a paramedic to this connection manager

        Args:
            websocket: WebSocket that the paramedic has connected to.
            paramedicId: The id of the paramedic on this connection.
        """
        if not self.is_ready:
            await self._bind()
        if self.activeConnections.get(paramedicId, False):
            raise KeyError("The paramedic is already connected.")

        await mediator.send(ActivateParamedicCommand(paramedicId=paramedicId))

        await websocket.accept()
        self.activeConnections[paramedicId] = websocket

    async def _bind(self):
        await self._binder.bind(RequestEmergencyAssignmentEvent, self._notify)
        self.is_ready = True

    async def _notify(self, payload: RequestEmergencyAssignmentEventPayload):
        result = await appMediator.send(
            GetEmergencyByIdQuery(emergencyId=payload.emergencyId)
        )
        await self.activeConnections[payload.paramedicId].send_text(
            EmergencyAssignmentRequestedEvent(
                event=MessageEvent.ASSIGNMENT_REQUESTED, payload=result.emergency
            ).model_dump_json()
        )

    async def subscribe(self, paramedicId: uuid.UUID, connection: WebSocket):
        """Register a subscriptor connection to send location updates
        to."""
        if paramedicId not in self.subscribers.keys():
            self.subscribers[paramedicId] = set()

        self.subscribers[paramedicId].add(connection)
        logger.info(f"registered subscriber for {paramedicId}")

    async def unsubscribe(self, paramedicId: uuid.UUID, connection: WebSocket):
        """Unregister a subscription from this paramedic id"""
        if paramedicId not in self.subscribers.keys():
            return

        self.subscribers[paramedicId].remove(connection)

    async def _autoprune_subscriber_connections(self, paramedicId: uuid.UUID):
        if paramedicId not in self.subscribers.keys():
            return

        activeConnections = set(
            ws
            for ws in self.subscribers[paramedicId]
            if ws.client_state == WebSocketState.CONNECTED
        )

        self.subscribers[paramedicId] = activeConnections

    async def _broadcast_location_update(
        self, paramedicId: uuid.UUID, newLocation: Location
    ):
        if paramedicId not in self.subscribers.keys():
            return

        await self._autoprune_subscriber_connections(paramedicId)

        for ws in self.subscribers[paramedicId]:
            await ws.send_text(
                ParamedicLocationUpdatedEvent(
                    payload=LocationUpdatedPayload(
                        paramedicId=paramedicId, location=newLocation
                    )
                ).model_dump_json()
            )

    async def handle_message(
        self, message: Message, paramedicId: uuid.UUID, mediator: cqrs.RequestMediator
    ):
        if not self.activeConnections.get(paramedicId, False):
            raise KeyError("The paramedic is not connected.")

        match message.command:
            case MessageCommand.UPDATE_LOCATION:
                newLocation = UpdateLocationPayload.model_validate(
                    message.payload
                ).to_location()

                await mediator.send(
                    UpdateParamedicLocationCommand(
                        paramedicId=paramedicId,
                        newLocation=newLocation,
                    )
                )
                await self._broadcast_location_update(paramedicId, newLocation)

    async def disconnect(self, paramedicId: uuid.UUID, mediator: cqrs.RequestMediator):
        """Disconnect this paramedic from the location tracking.

        Args:
            paramedicId: The id of the paramedic whose connection to terminate
        """
        if not self.activeConnections[paramedicId]:
            raise KeyError("The paramedic is not connected.")
        await mediator.send(DeleteParamedicFromRTDbCommand(paramedicId=paramedicId))
        self.activeConnections.pop(paramedicId)


discoveryAdapter = DockerServiceDiscoveryAdapter("docker-compose.yaml")
appMediator: cqrs.RequestMediator = create_mediator(
    discoveryAdapter,
    useCases=[
        GetUserByEmailQuery,
        GetEmergencyByIdQuery,
        UpdateParamedicLocationCommand,
        ActivateParamedicCommand,
        DeleteParamedicFromRTDbCommand,
        RequestEmergencyAssignmentCommand,
    ],
)

binder: NotificationEventBinderPort = discoveryAdapter.build_adapter(
    NotificationEventBinderPort
)

connectionManager = UnallocatedParamedicConnectionManager(binder)


@app.websocket("/api/v1/locationTracker")
async def location_tracker_endpoint(websocket: WebSocket, token: str):
    # Verify the JWT token
    user = await get_user_in_token(token, appMediator)
    if user is None or user.userRole != UserRole.PARAMEDIC:
        logger.warning("Invalid token provided")
        await websocket.close(code=1008)  # Close with policy violation status
        return
    logger.info(f"Paramedic {user.name} authenticated successfully")
    try:
        await connectionManager.connect(websocket, user.id, appMediator)
    except UserNotFoundError:
        logger.info(f"User not found with id {user.id}")
        return
    try:
        async for message in websocket.iter_json():
            parsedMessage = Message.model_validate(message)
            await connectionManager.handle_message(parsedMessage, user.id, appMediator)
    except WebSocketDisconnect:
        await connectionManager.disconnect(user.id, appMediator)
    finally:
        await connectionManager.disconnect(user.id, appMediator)


@app.websocket("/api/v1/locationTracker/watch")
async def location_subscription_endpoint(websocket: WebSocket, token: str):
    """An endpoint for operators to watch the location of paramedics they subscribe to"""
    # Verify the JWT token
    user = await get_user_in_token(token, appMediator)
    if user is None or user.userRole != UserRole.OPERATOR:
        logger.warning("Invalid token provided")
        await websocket.close(code=1008)  # Close with policy violation status
        return
    logger.info(f"Operator {user.name} authenticated successfully")

    await websocket.accept()
    async for message in websocket.iter_json():
        try:
            command = parse_subscription_state_command(message)
            match command.command:
                case MessageCommand.SUBSCRIBE:
                    await connectionManager.subscribe(command.payload, websocket)
                case MessageCommand.UNSUBSCRIBE:
                    await connectionManager.unsubscribe(command.payload, websocket)
        except InvalidCommandException:
            await websocket.send_text(
                ErrorEvent(payload="invalid command").model_dump_json()
            )
        except KeyError:
            await websocket.send_text(
                ErrorEvent(
                    payload="subscription never registered in the first place"
                ).model_dump_json()
            )
