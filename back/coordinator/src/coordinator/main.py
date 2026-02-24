import logging

import cqrs
from core.application.factories import create_mediator
from core.application.ports.coordinator import CoordinatorPort
from core.application.use_cases.report_emergency import ReportEmergencyCommand
from core.domain.entities import Emergency
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
    useCases=[ReportEmergencyCommand],
    adapter=coordinatorAdapter,
)


@app.get("/")
def hello():
    return {"hello": "world"}


@app.post("/emergency")
async def report_emergency(emergencyCommand: ReportEmergencyCommand):
    await appMediator.send(emergencyCommand)
