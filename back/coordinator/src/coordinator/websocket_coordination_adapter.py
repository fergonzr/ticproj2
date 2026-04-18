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

from coordinator.active_emergency_manager import (
    ActiveEmergencyCoordinator,
    MessageEvent,
)
from coordinator.operator_connection_pool import OperatorConnectionPool

from .models import (
    BaseOperatorBusinessCommand,
    EmergencyReceivedEvent,
    EmergencyTakenEvent,
    ErrorEvent,
    InvalidCommandException,
    MessageCommand,
    SafeEmergency,
    SetOperatorAvailabilityStatusCommand,
    UserGreetToSystemEvent,
    citizenCommand,
    parse_citizen_command,
    parse_operator_command,
    parse_paramedic_command,
)
from .models import ReportEmergencyCommand as ReportEmergencyCommandDTO

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


class WebSocketCoordinatorAdapter(CoordinatorPort):
    _managers: Dict[uuid.UUID, ActiveEmergencyCoordinator]
    _operatorConnectionPool: OperatorConnectionPool
    _unassignedEmergencyQueue: List[Emergency]
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
                AssignComplexityLevelToEmergencyCommand,
                RequestEmergencyAssignmentCommand,
                TransferEmergencyToMedicalCenterCommand,
                ConfirmEmergencyAssignmentCommand,
                AnnounceArrivalToEmergencyCommand,
                MarkEmergencyAsResolvedCommand,
                CloseEmergencyCommand,
            ],
            adapter=self,
        )
        self._unassignedEmergencyQueue = []

    # Callback methods as CoordinatorPort
    async def report_emergency(self, emergency: Emergency):
        self._managers[emergency.id] = ActiveEmergencyCoordinator(emergency)

        # Enqueue the emergency
        self._unassignedEmergencyQueue.append(emergency)

        # Then report it to all operators
        await self._operatorConnectionPool.broadcast(
            EmergencyReceivedEvent(
                event=MessageEvent.RECEIVED,
                payload=SafeEmergency.from_domain(emergency),
            ).model_dump_json()
        )

    async def report_triage(self, emergency: Emergency):
        return await self._managers[emergency.id].report_triage(emergency)

    async def report_complexity_assignment(self, emergency: Emergency):
        return await self._managers[emergency.id].report_complexity_assignment(
            emergency
        )

    async def report_transfer(self, emergency: Emergency):
        return await self._managers[emergency.id].report_transfer(emergency)

    async def report_resolution(self, emergency: Emergency):
        return await self._managers[emergency.id].report_resolution(emergency)

    async def report_closing(self, emergency: Emergency):
        return await self._managers[emergency.id].report_closing(emergency)

    async def report_assignment(self, emergency: Emergency, paramedic: Paramedic):
        return await self._managers[emergency.id].report_assignment(
            emergency, paramedic
        )

    async def report_arrival(self, emergency: Emergency):
        return await self._managers[emergency.id].report_arrival(emergency)

    # Paramedic command handling
    async def handle_paramedic_command(self, emergencyId: uuid.UUID, message: dict):
        command = parse_paramedic_command(message)
        match command.command:
            case MessageCommand.ARRIVE:
                domain_command = command.to_domain(emergencyId)
                await self.mediator.send(domain_command)
            case MessageCommand.ASSIGN_COMPLEXITY:
                domain_command = command.to_domain(emergencyId)
                await self.mediator.send(domain_command)
            case MessageCommand.TRANSFER:
                domain_command = command.to_domain(emergencyId)
                await self.mediator.send(domain_command)
            case MessageCommand.MARK_RESOLVED:
                domain_command = command.to_domain(emergencyId)
                await self.mediator.send(domain_command)

    # Operator connection handling
    async def handle_operator_connect(
        self, token: str, websocket: WebSocket
    ) -> uuid.UUID | None:
        user = await get_user_in_token(token, self.mediator)
        if user is None or user.userRole != UserRole.OPERATOR:
            logger.warning("Invalid token provided")
            await websocket.close(code=1008)  # Close with policy violation status
            return None

        await websocket.accept()
        self._operatorConnectionPool.add_operator_connection(user.id, websocket)

        # Send all unmanaged emergencies to the recently connected operator
        for emergency in self._unassignedEmergencyQueue:
            await websocket.send_text(
                UserGreetToSystemEvent(
                    event=MessageEvent.GREETING,
                    payload=SafeEmergency.from_domain(emergency),
                ).model_dump_json()
            )

        return user.id

    async def handle_operator_command(self, operatorId: uuid.UUID, message: dict):
        command = parse_operator_command(message)
        if isinstance(command, BaseOperatorBusinessCommand):
            await self.mediator.send(command.to_domain())
            return
        match command.command:
            # This command is deprecated and will be removed some day.
            case MessageCommand.SET_AVAILABILITY:
                pass
            case MessageCommand.SUBSCRIBE:
                await self._managers[command.payload].add_operator_connection(
                    self._operatorConnectionPool[operatorId]
                )
                await self._operatorConnectionPool.broadcast(
                    EmergencyTakenEvent(
                        event=MessageEvent.TAKEN, payload=command.payload
                    ).model_dump_json()
                )

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

    async def handle_citizen_connect(
        self, citizenConnection: WebSocket, message: dict
    ) -> uuid.UUID:
        command = parse_citizen_command(message)
        match command.command:
            case MessageCommand.REPORT:
                return await self.submit_report(citizenConnection, command)
            case MessageCommand.SUBSCRIBE:
                await self._managers[command.payload].add_citizen_connection(
                    citizenConnection
                )
                return command.payload

    async def handle_citizen_disconnect(self, emergencyId: uuid.UUID):
        pass

    async def submit_report(
        self, citizenConnection: WebSocket, command: ReportEmergencyCommandDTO
    ) -> uuid.UUID:
        emergency: Emergency = (await self.mediator.send(command.to_domain())).emergency
        await self._managers[emergency.id].add_citizen_connection(
            citizenConnection, greet=False
        )
        await self._managers[emergency.id].report(emergency)
        return emergency.id
