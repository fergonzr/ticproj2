import logging
import os
import uuid
from typing import Dict

import cqrs
from core.application.factories import create_mediator
from core.application.ports.location_updater import ParamedicLocationUpdaterPort
from core.application.use_cases.activate_paramedic import (
    ActivateParamedicCommand,
    UserRole,
)
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.application.use_cases.update_paramedic_loc import (
    UpdateParamedicLocationCommand,
)
from core.domain.entities.emergency import Emergency
from core.domain.entities.user import UserNotFoundError
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.applications import FastAPI
from sie_auth import get_user_in_token

from .models import Message, MessageCommand, UpdateLocationPayload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

app = FastAPI()


class UnallocatedParamedicConnectionManager(ParamedicLocationUpdaterPort):
    activeConnections: Dict[uuid.UUID, WebSocket]
    mediator: cqrs.RequestMediator

    def __init__(self, mediator: cqrs.RequestMediator):
        self.activeConnections = {}
        self.mediator = mediator

    async def connect(self, websocket: WebSocket, paramedicId: uuid.UUID):
        """Add a paramedic to this connection manager

        Args:
            websocket: WebSocket that the paramedic has connected to.
            paramedicId: The id of the paramedic on this connection.
        """
        if self.activeConnections.get(paramedicId, False):
            raise KeyError("The paramedic is already connected.")

        await self.mediator.send(ActivateParamedicCommand(paramedicId=paramedicId))

        await websocket.accept()
        self.activeConnections[paramedicId] = websocket

    async def handle_message(self, message: Message, paramedicId: uuid.UUID):
        if not self.activeConnections.get(paramedicId, False):
            raise KeyError("The paramedic is not connected.")

        match message.command:
            case MessageCommand.UPDATE_LOCATION:
                newLocation = UpdateLocationPayload.model_validate(
                    message.payload
                ).to_location()

                await self.mediator.send(
                    UpdateParamedicLocationCommand(
                        paramedicId=paramedicId,
                        newLocation=newLocation,
                    )
                )

    async def disconnect(self, paramedicId: uuid.UUID):
        """Disconnect this paramedic from the location tracking.

        Args:
            paramedicId: The id of the paramedic whose connection to terminate
        """
        if not self.activeConnections[paramedicId]:
            raise KeyError("The paramedic is not connected.")
        self.activeConnections.pop(paramedicId)

    async def request_emergency_assignment(
        self, paramedicId: uuid.UUID, emergency: Emergency, confirmationURL: str
    ):
        return await super().request_emergency_assignment(
            paramedicId, emergency, confirmationURL
        )


discoveryAdapter = DockerServiceDiscoveryAdapter("docker-compose.yaml")
appMediator: cqrs.RequestMediator = create_mediator(
    discoveryAdapter,
    useCases=[
        GetUserByEmailQuery,
        UpdateParamedicLocationCommand,
        ActivateParamedicCommand,
    ],
)
connectionManager = UnallocatedParamedicConnectionManager(appMediator)


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
        await connectionManager.connect(websocket, user.id)
    except UserNotFoundError:
        logger.info(f"User not found with id {user.id}")
        return
    try:
        async for message in websocket.iter_json():
            parsedMessage = Message.model_validate(message)
            await connectionManager.handle_message(parsedMessage, user.id)
    except WebSocketDisconnect:
        await connectionManager.disconnect(user.id)
    finally:
        await connectionManager.disconnect(user.id)
