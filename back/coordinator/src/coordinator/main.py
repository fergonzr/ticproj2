import logging
import uuid
from datetime import datetime
from queue import Queue
from typing import Dict, List, Tuple

import cqrs
from core.application.factories import create_mediator
from core.application.ports.coordinator import CoordinatorPort
from core.application.use_cases.confirm_emergency_assignment import (
    ConfirmEmergencyAssignmentCommand,
)
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.application.use_cases.report_emergency import ReportEmergencyCommand
from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentCommand,
)
from core.application.use_cases.triage_emergency import TriageEmergencyCommand
from core.domain.entities import Emergency, Paramedic
from core.domain.entities.emergency import (
    EmergencyNotFoundError,
    InvalidEmergencyStateTransitionException,
)
from core.domain.entities.user import User, UserNotFoundError, UserRole
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.applications import FastAPI
from pydantic import ValidationError
from sie_auth import get_user_in_token

from coordinator.active_emergency_manager import ActiveEmergencyCoordinator

from .models import InvalidCommandException, MessageCommand, operator_command_to_domain
from .models import ReportEmergencyCommand as ReportEmergencyCommandDTO

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

app = FastAPI()
discoveryAdapter = DockerServiceDiscoveryAdapter("docker-compose.yaml")


class RestCoordinatorAdapter(CoordinatorPort):
    async def report_emergency(self, emergency: Emergency):
        logger.info(f"Emergency reported: {emergency.to_dict()}")


class WebSocketCoordinatorAdapter(CoordinatorPort):
    _managers: Dict[uuid.UUID, ActiveEmergencyCoordinator]
    _operatorConnectionPool: Dict[uuid.UUID, Tuple[bool, WebSocket]]
    _emergencyCounter: int
    _unassignedEmergencyQueue: Queue[Emergency]
    mediator: cqrs.RequestMediator

    def __init__(self):
        self._managers = {}
        self._emergencyCounter = 0
        self.mediator = create_mediator(
            discoveryAdapter,
            useCases=[
                ReportEmergencyCommand,
                GetUserByEmailQuery,
                TriageEmergencyCommand,
                RequestEmergencyAssignmentCommand,
                ConfirmEmergencyAssignmentCommand,
            ],
            adapter=self,
        )
        self._operatorConnectionPool = {}
        self._unassignedEmergencyQueue = Queue()

    def _next_available_operator_connection(self) -> WebSocket | None:
        """Return the connection of the next operator that is
        available on a round-robin fashion."""

        values = list(self._operatorConnectionPool.values())
        index = self._emergencyCounter
        for delta in range(len(values)):
            if values[(index + delta) % len(values)][0]:
                self._emergencyCounter += 1
                return values[(index + delta) % len(values)][1]
        return None

    # Callback methods as CoordinatorPort
    async def report_emergency(self, emergency: Emergency):
        self._managers[emergency.id] = ActiveEmergencyCoordinator(emergency)
        operatorConnection = self._next_available_operator_connection()

        # Enqueue the emergency if there is there is no operator available
        if operatorConnection is None:
            self._unassignedEmergencyQueue.put_nowait(emergency)
        else:
            await self._managers[emergency.id].add_operator_connection(
                operatorConnection, greet=False
            )

        await self._managers[emergency.id].report(emergency)

    async def report_triage(self, emergency: Emergency):
        return await self._managers[emergency.id].report_triage(emergency)

    async def report_assignment(self, emergency: Emergency, paramedic: Paramedic):
        return await self._managers[emergency.id].report_assignment(
            emergency, paramedic
        )

    # Operator connection handling
    async def handle_operator_connect(
        self, token: str, websocket: WebSocket
    ) -> uuid.UUID | None:
        user = await get_user_in_token(token, coordinatorAdapter.mediator)
        if user is None or user.userRole != UserRole.OPERATOR:
            logger.warning("Invalid token provided")
            await websocket.close(code=1008)  # Close with policy violation status
            return None

        self._operatorConnectionPool[user.id] = (True, websocket)
        return user.id

    async def handle_operator_command(self, message: dict):
        await self.mediator.send(operator_command_to_domain(message))

    async def handle_operator_disconnect(self, userId: uuid.UUID):
        # TODO: check if the operator has any active emergencies
        # before popping it
        self._operatorConnectionPool.pop(userId)

    # Paramedic connection handling
    async def handle_paramedic_confirm(
        self, websocket: WebSocket, token: str, emergencyId: uuid.UUID
    ) -> uuid.UUID | None:
        user = await get_user_in_token(token, coordinatorAdapter.mediator)
        logger.info(user)
        if user is None or user.userRole != UserRole.PARAMEDIC:
            logger.warning("Invalid token provided")
            await websocket.close(code=1008)  # Close with policy violation status
            return None

        await self._managers[emergencyId].add_paramedic_connection(
            websocket, greet=False
        )
        await websocket.accept()
        await self.mediator.send(
            ConfirmEmergencyAssignmentCommand(
                paramedicId=user.id, emergencyId=emergencyId
            )
        )
        return user.id

    async def submit_report(
        self, citizenConnection: WebSocket, command: ReportEmergencyCommandDTO
    ):
        emergency: Emergency = (await self.mediator.send(command.to_domain())).emergency
        await self._managers[emergency.id].add_citizen_connection(citizenConnection)


coordinatorAdapter = WebSocketCoordinatorAdapter()


@app.websocket("/api/v1/coordination/citizen")
async def citizen_connection(websocket: WebSocket):
    # Wait for client to either report a message or subscribe to an
    # existing emergency
    command: ReportEmergencyCommandDTO | None = None
    await websocket.accept()
    while command is None:
        try:
            data = await websocket.receive_text()
            command = ReportEmergencyCommandDTO.model_validate_json(data)
        except ValidationError as e:
            await websocket.send_json({"message": f"invalid data sent: {e}"})
            logger.debug(e)

    await coordinatorAdapter.submit_report(websocket, command)
    try:
        async for message in websocket.iter_json():
            await websocket.send_json({"message": "invalid request"})
    except WebSocketDisconnect:
        await websocket.close()


@app.websocket("/api/v1/coordination/operator")
async def operator_connection(websocket: WebSocket, token: str):
    userId = await coordinatorAdapter.handle_operator_connect(token, websocket)

    # Acept the connection only after verifying the user
    if userId is None:
        return
    await websocket.accept()

    try:
        async for message in websocket.iter_json():
            try:
                await coordinatorAdapter.handle_operator_command(message)
            except (InvalidCommandException, ValidationError):
                await websocket.send_json({"message": "invalid command"})
            except InvalidEmergencyStateTransitionException:
                await websocket.send_json(
                    {"message": "invalid operation on specified emergency"}
                )
            except EmergencyNotFoundError:
                await websocket.send_json(
                    {"message": "no emergency with that id was found"}
                )
            except UserNotFoundError:
                await websocket.send_json({"message": "no user with that id was found"})
    except WebSocketDisconnect:
        await coordinatorAdapter.handle_operator_disconnect(userId)
        await websocket.close()


@app.websocket("/api/v1/coordination/paramedic/{emergencyId}")
async def paramedic_connection(
    websocket: WebSocket, emergencyId: uuid.UUID, token: str
):
    logger.info(emergencyId)
    try:
        userId = await coordinatorAdapter.handle_paramedic_confirm(
            websocket, token, emergencyId
        )
    # Invalid emergency Id
    except KeyError:
        logger.info(f"emergency {emergencyId} does not exist")
        await websocket.close(reason=f"emergency {emergencyId} does not exist")
        return
    if userId is None:
        return

    try:
        async for message in websocket.iter_json():
            await websocket.send_json({"message": "invalid request"})
    except WebSocketDisconnect:
        await websocket.close()
