import logging
import uuid
from datetime import datetime
from queue import Queue
from typing import Annotated, Dict, List, Tuple

import cqrs
from core.application.factories import create_mediator
from core.application.ports import ServiceDiscoveryPort
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
from fastapi import Depends, WebSocket, WebSocketDisconnect
from fastapi.applications import FastAPI
from pydantic import ValidationError
from sie_auth import get_user_in_token

from coordinator.active_emergency_manager import ActiveEmergencyCoordinator
from coordinator.operator_connection_pool import OperatorConnectionPool

from .models import (
    ErrorEvent,
    InvalidCommandException,
    MessageCommand,
    operator_command_to_domain,
)
from .models import ReportEmergencyCommand as ReportEmergencyCommandDTO

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


class RestCoordinatorAdapter(CoordinatorPort):
    async def report_emergency(self, emergency: Emergency):
        logger.info(f"Emergency reported: {emergency.to_dict()}")


class WebSocketCoordinatorAdapter(CoordinatorPort):
    _managers: Dict[uuid.UUID, ActiveEmergencyCoordinator]
    _operatorConnectionPool: OperatorConnectionPool
    _unassignedEmergencyQueue: Queue[Emergency]
    mediator: cqrs.RequestMediator

    def __init__(self, discoveryPort: ServiceDiscoveryPort):
        self._managers = {}
        self._operatorConnectionPool = OperatorConnectionPool()
        self.mediator = create_mediator(
            discoveryPort,
            useCases=[
                ReportEmergencyCommand,
                GetUserByEmailQuery,
                TriageEmergencyCommand,
                RequestEmergencyAssignmentCommand,
                ConfirmEmergencyAssignmentCommand,
            ],
            adapter=self,
        )
        self._unassignedEmergencyQueue = Queue()

    # Callback methods as CoordinatorPort
    async def report_emergency(self, emergency: Emergency):
        self._managers[emergency.id] = ActiveEmergencyCoordinator(emergency)
        operatorConnection = (
            self._operatorConnectionPool.next_available_operator_connection()
        )

        # Enqueue the emergency if there is there is no operator available
        if operatorConnection is None:
            self._unassignedEmergencyQueue.put_nowait(emergency)
        else:
            await self._managers[emergency.id].add_operator_connection(
                operatorConnection, greet=False
            )

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
        user = await get_user_in_token(token, self.mediator)
        if user is None or user.userRole != UserRole.OPERATOR:
            logger.warning("Invalid token provided")
            await websocket.close(code=1008)  # Close with policy violation status
            return None

        self._operatorConnectionPool.add_operator_connection(user.id, websocket)
        return user.id

    async def handle_operator_command(self, message: dict):
        await self.mediator.send(operator_command_to_domain(message))

    async def handle_operator_disconnect(self, userId: uuid.UUID):
        # TODO: check if the operator has any active emergencies
        # before popping it
        self._operatorConnectionPool.remove_operator_connection(userId)

    # Paramedic connection handling
    async def handle_paramedic_confirm(
        self, websocket: WebSocket, token: str, emergencyId: uuid.UUID
    ) -> uuid.UUID | None:
        user = await get_user_in_token(token, self.mediator)
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
        await self._managers[emergency.id].add_citizen_connection(
            citizenConnection, greet=False
        )
        await self._managers[emergency.id].report(emergency)


discoveryAdapter = DockerServiceDiscoveryAdapter("docker-compose.yaml")
websocketAdapter = WebSocketCoordinatorAdapter(discoveryAdapter)


def coordination_adapter() -> WebSocketCoordinatorAdapter:
    return websocketAdapter


app = FastAPI()


@app.websocket("/api/v1/coordination/citizen")
async def citizen_connection(
    websocket: WebSocket,
    coordinatorAdapter: Annotated[
        WebSocketCoordinatorAdapter, Depends(coordination_adapter)
    ],
):
    # Wait for client to either report a message or subscribe to an
    # existing emergency
    command: ReportEmergencyCommandDTO | None = None
    await websocket.accept()
    while command is None:
        try:
            data = await websocket.receive_text()
            command = ReportEmergencyCommandDTO.model_validate_json(data)
        except ValidationError as e:
            await websocket.send_text(
                ErrorEvent(payload=f"invalid data sent: {e}").model_dump_json()
            )
            logger.debug(e)

    await coordinatorAdapter.submit_report(websocket, command)
    try:
        async for message in websocket.iter_json():
            await websocket.send_text(
                ErrorEvent(payload="invalid request").model_dump_json()
            )
    except WebSocketDisconnect:
        await websocket.close()


@app.websocket("/api/v1/coordination/operator")
async def operator_connection(
    websocket: WebSocket,
    token: str,
    coordinatorAdapter: Annotated[
        WebSocketCoordinatorAdapter, Depends(coordination_adapter)
    ],
):
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
                await websocket.send_text(
                    ErrorEvent(payload="invalid command").model_dump_json()
                )
            except InvalidEmergencyStateTransitionException:
                await websocket.send_text(
                    ErrorEvent(
                        payload="invalid operation on specified emergency"
                    ).model_dump_json()
                )
            except EmergencyNotFoundError:
                await websocket.send_text(
                    ErrorEvent(
                        payload="no emergency with that id was found"
                    ).model_dump_json()
                )
            except UserNotFoundError:
                await websocket.send_text(
                    ErrorEvent(
                        payload="no active user with that id was found"
                    ).model_dump_json()
                )
    except WebSocketDisconnect:
        await coordinatorAdapter.handle_operator_disconnect(userId)
        await websocket.close()


@app.websocket("/api/v1/coordination/paramedic/{emergencyId}")
async def paramedic_connection(
    websocket: WebSocket,
    emergencyId: uuid.UUID,
    token: str,
    coordinatorAdapter: Annotated[
        WebSocketCoordinatorAdapter, Depends(coordination_adapter)
    ],
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

    except UserNotFoundError:
        # This error is actually caused by the paramedic existing on
        # the realtime storage database but not being active at the
        # time.
        await websocket.close(code=1003, reason="paramedic is not active")
        return

    if userId is None:
        await websocket.close(code=1003, reason="Forbidden")
        return

    try:
        async for message in websocket.iter_json():
            await websocket.send_text(
                ErrorEvent(payload="invalid request").model_dump_json()
            )
    except WebSocketDisconnect:
        await websocket.close()
