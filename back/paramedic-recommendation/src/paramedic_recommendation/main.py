import logging
import uuid
from asyncio.unix_events import SafeChildWatcher
from typing import Annotated, Literal

import cqrs
from core.application.factories import create_mediator
from core.application.ports import ServiceDiscoveryPort
from core.application.use_cases.get_active_paramedics import (
    GetActiveParamedicsQuery,
)
from core.application.use_cases.get_nearby_paramedics_for_emergency import (
    GetNearbyParamedicsForEmergencyQuery,
)
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.entities.user import Paramedic, User, UserRole
from core.domain.value_objects.alert import NoLocationError
from core.domain.value_objects.resource import LocatableResource
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sie_auth import generate_get_current_user_dep

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# TODO: bind the discovery adapter and mediator to a global object

discoveryService = DockerServiceDiscoveryAdapter("docker-compose.yaml")
appMediator = create_mediator(
    discoveryService,
    useCases=[
        GetUserByEmailQuery,
        GetNearbyParamedicsForEmergencyQuery,
        GetActiveParamedicsQuery,
    ],
)


def get_discovery_adapter() -> ServiceDiscoveryPort:
    return discoveryService


async def get_mediator(
    discovery: Annotated[ServiceDiscoveryPort, Depends(get_discovery_adapter)],
) -> cqrs.RequestMediator:
    return appMediator


app = FastAPI()


get_operator_user = generate_get_current_user_dep(
    appMediator, roles={UserRole.OPERATOR}
)


class SafeParamedic(BaseModel):
    """DTO that represents an available paramedic"""

    id: uuid.UUID
    name: str
    email: str
    userRole: Literal[UserRole.PARAMEDIC]
    resource: LocatableResource
    assignedEmergencyId: Literal[None]

    @staticmethod
    def from_domain(paramedic: Paramedic):
        # Leveraging pydantic's built-in validation
        return SafeParamedic(
            id=paramedic.id,
            name=paramedic.name,
            email=paramedic.email,
            userRole=paramedic.userRole,
            resource=paramedic.resource,
            assignedEmergencyId=paramedic.assignedEmergencyId,
        )


class ParamedicCounts(BaseModel):
    """Aggregated counts of paramedic states for the operator dashboard."""

    available: int
    onRoute: int
    total: int


@app.get("/api/v1/paramedicRecommendation/active")
async def get_active_paramedics(
    mediator: Annotated[cqrs.RequestMediator, Depends(get_mediator)],
    user: Annotated[User, Depends(get_operator_user)],
) -> ParamedicCounts:
    """Returns aggregate counts of paramedics across the system.

    - `available`: connected, has reported GPS, not assigned and not busy.
    - `onRoute`: assigned to an emergency or marked busy.
    - `total`: every paramedic currently registered in realtime storage.
    """
    try:
        result = await mediator.send(GetActiveParamedicsQuery())
    except Exception as e:
        raise HTTPException(500, {"error": f"internal, {e}"})

    available = 0
    onRoute = 0
    for paramedic in result.paramedics:
        if paramedic.assignedEmergencyId is not None or (
            paramedic.resource is not None and paramedic.resource.busy
        ):
            onRoute += 1
        elif paramedic.resource is not None:
            available += 1

    return ParamedicCounts(
        available=available,
        onRoute=onRoute,
        total=len(result.paramedics),
    )


@app.get("/api/v1/paramedicRecommendation/{emergencyId}")
async def get_paramedic_recommendations(
    emergencyId: uuid.UUID,
    mediator: Annotated[cqrs.RequestMediator, Depends(get_mediator)],
    user: Annotated[User, Depends(get_operator_user)],
) -> list[SafeParamedic]:
    query = GetNearbyParamedicsForEmergencyQuery(emergencyId=emergencyId)
    try:
        result = await mediator.send(query)
    except EmergencyNotFoundError:
        raise HTTPException(404, {"error": f"emergency {emergencyId} not found"})
    except NoLocationError:
        raise HTTPException(
            400, {"error": f"emergency {emergencyId} has no associated location"}
        )
    except Exception as e:
        raise HTTPException(500, {"error": f"internal, {e}"})
    return [SafeParamedic.from_domain(paramedic) for paramedic in result.paramedics]
