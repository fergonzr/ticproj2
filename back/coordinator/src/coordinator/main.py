import logging

import cqrs
from core.application.factories import ServiceAdapterFactory, create_mediator
from core.application.ports import Service, ServiceDiscoveryPort
from core.application.ports.coordinator import CoordinatorPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases.report_emergency import (
    ReportEmergencyCommand,
    ReportEmergencyHandler,
)
from core.domain.entities import Emergency
from cqrs.container.dependency_injector import DependencyInjectorCQRSContainer
from cqrs.container.protocol import Container as CQRSContainer
from cqrs.requests import bootstrap
from dependency_injector import containers, providers
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi.applications import FastAPI

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

app = FastAPI()


class RestCoordinatorAdapter(CoordinatorPort):
    async def report_emergency(self, emergency: Emergency):
        logger.info(f"Emergency reported: {emergency.to_dict()}")


discoveryAdapter = DockerServiceDiscoveryAdapter("docker-compose.yaml")
coordinatorAdapter = RestCoordinatorAdapter()
appMediator: cqrs.RequestMediator = create_mediator(
    discoveryAdapter,
    ports=[RealTimeStoragePort],
    useCases=[(ReportEmergencyCommand, ReportEmergencyHandler)],
    adapter=coordinatorAdapter,
)


@app.get("/")
def hello():
    return {"hello": "world"}


@app.post("/emergency")
async def report_emergency(emergencyCommand: ReportEmergencyCommand):
    await appMediator.send(emergencyCommand)
