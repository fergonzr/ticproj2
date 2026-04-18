import logging
import uuid
from datetime import datetime
from queue import Queue
from typing import Annotated, Dict, List, Tuple

import cqrs
from core.application.factories import create_mediator
from core.application.ports import ServiceDiscoveryPort
from core.application.ports.coordinator import CoordinatorPort
from core.application.use_cases.announce_arrival import (
    AnnounceArrivalToEmergencyCommand,
)
from core.application.use_cases.assign_complexity_level_to_emergency import (
    AssignComplexityLevelToEmergencyCommand,
)
from core.application.use_cases.close_emergency import CloseEmergencyCommand
from core.application.use_cases.confirm_emergency_assignment import (
    ConfirmEmergencyAssignmentCommand,
)
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.application.use_cases.mark_emergency_as_resolved import (
    MarkEmergencyAsResolvedCommand,
)
from core.application.use_cases.report_emergency import ReportEmergencyCommand
from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentCommand,
)
from core.application.use_cases.transfer_emergency_to_medical_center import (
    TransferEmergencyToMedicalCenterCommand,
)
from core.application.use_cases.triage_emergency import TriageEmergencyCommand
from core.domain.entities import Emergency, Paramedic
from core.domain.entities.emergency import (
    ComplexityLevelMismatchException,
    EmergencyNotFoundError,
    InvalidEmergencyStateTransitionException,
)
from core.domain.entities.medical_center import MedicalCenterNotFoundError
from core.domain.entities.user import (
    BusyResourceError,
    User,
    UserNotFoundError,
    UserRole,
)
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import Depends, WebSocket, WebSocketDisconnect
from fastapi.applications import FastAPI
from pydantic import ValidationError
from sie_auth import get_user_in_token

from coordinator.active_emergency_manager import ActiveEmergencyCoordinator
from coordinator.operator_connection_pool import OperatorConnectionPool

from .models import (
    BaseOperatorBusinessCommand,
    ErrorEvent,
    InvalidCommandException,
    MessageCommand,
    SetOperatorAvailabilityStatusCommand,
    citizenCommand,
    parse_citizen_command,
    parse_operator_command,
    parse_paramedic_command,
)
from .models import ReportEmergencyCommand as ReportEmergencyCommandDTO
from .websocket_coordination_adapter import WebSocketCoordinatorAdapter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


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
    emergencyId = None
    await websocket.accept()
    while command is None:
        try:
            message = await websocket.receive_json()
            emergencyId = await coordinatorAdapter.handle_citizen_connect(
                websocket, message
            )
            break
        except InvalidCommandException:
            await websocket.send_text(
                ErrorEvent(payload="Could not parse command").model_dump_json()
            )
        except KeyError:
            await websocket.send_text(
                ErrorEvent(
                    payload="No active emergency with specified key exists"
                ).model_dump_json()
            )

    try:
        async for message in websocket.iter_json():
            await websocket.send_text(
                ErrorEvent(payload="invalid request").model_dump_json()
            )
    except WebSocketDisconnect:
        if emergencyId is not None:
            await coordinatorAdapter.handle_citizen_disconnect(emergencyId)


@app.websocket("/api/v1/coordination/operator")
async def operator_connection(
    websocket: WebSocket,
    token: str,
    coordinatorAdapter: Annotated[
        WebSocketCoordinatorAdapter, Depends(coordination_adapter)
    ],
):
    # Acepting the connection is automatically done by this method
    userId = await coordinatorAdapter.handle_operator_connect(token, websocket)

    if userId is None:
        return

    async for message in websocket.iter_json():
        try:
            await coordinatorAdapter.handle_operator_command(userId, message)
        except (InvalidCommandException, ValidationError) as e:
            logger.info(e)
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
        except KeyError:
            await websocket.send_text(
                ErrorEvent(
                    payload="no active emergency with that id was found"
                ).model_dump_json()
            )

    await coordinatorAdapter.handle_operator_disconnect(userId)
    logger.info("disconnection")


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
    # Invalid emergency Id or emergency not ready to be assigned.
    # Deliberatedly hiding that information here.
    except (KeyError, InvalidEmergencyStateTransitionException):
        logger.info(f"emergency {emergencyId} does not exist")
        await websocket.close(reason=f"emergency {emergencyId} does not exist")
        return

    except UserNotFoundError:
        # This error is actually caused by the paramedic existing on
        # the realtime storage database but not being active at the
        # time.
        await websocket.close(code=1003, reason="paramedic is not active")
        return
    except BusyResourceError:
        await websocket.close(code=1003, reason="paramedic is busy")
        return

    if userId is None:
        await websocket.close(code=1003, reason="Forbidden")
        return

    try:
        async for message in websocket.iter_json():
            try:
                await coordinatorAdapter.handle_paramedic_command(emergencyId, message)
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
            except MedicalCenterNotFoundError as e:
                await websocket.send_text(
                    ErrorEvent(
                        payload=f"no medical center with id {e.medicalCenterId} was found."
                    ).model_dump_json()
                )
            except UserNotFoundError:
                await websocket.send_text(
                    ErrorEvent(
                        payload="no active user with that id was found"
                    ).model_dump_json()
                )
            except ComplexityLevelMismatchException as e:
                await websocket.send_text(
                    ErrorEvent(
                        payload=f"cannot transfer to that medical center, the emergency has complexity level {e.complexityLevel}"
                    ).model_dump_json()
                )
            except KeyError:
                await websocket.send_text(
                    ErrorEvent(
                        payload="no active emergency with that id was found"
                    ).model_dump_json()
                )

    except WebSocketDisconnect:
        await websocket.close()
