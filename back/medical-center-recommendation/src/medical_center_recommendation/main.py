"""Example integration for medical center recommendation service.

This file demonstrates how the GetNearbyMedicalCentersForEmergencyQuery
use case could be integrated into a FastAPI service, similar to the
existing paramedic-recommendation service.
"""

import logging
import uuid
from typing import Annotated

import cqrs
from core.application.factories import create_mediator
from core.application.ports import ServiceDiscoveryPort
from core.application.use_cases.get_all_medical_centers import (
    GetAllMedicalCentersQuery,
)
from core.application.use_cases.get_nearby_medical_centers_for_emergency import (
    GetNearbyMedicalCentersForEmergencyQuery,
)
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.entities.medical_center import MedicalCenter
from core.domain.entities.user import UserRole
from core.domain.value_objects.alert import NoLocationError
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import Depends, FastAPI, HTTPException
from sie_auth import AuthUser, generate_get_current_user_dep

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# Initialize the service discovery and mediator
discoveryService = DockerServiceDiscoveryAdapter("docker-compose.yaml")
appMediator = create_mediator(
    discoveryService,
    useCases=[
        GetUserByEmailQuery,
        GetNearbyMedicalCentersForEmergencyQuery,
        GetAllMedicalCentersQuery,
    ],
)


def get_discovery_adapter() -> ServiceDiscoveryPort:
    return discoveryService


async def get_mediator(
    discovery: Annotated[ServiceDiscoveryPort, Depends(get_discovery_adapter)],
) -> cqrs.RequestMediator:
    return appMediator


app = FastAPI()

get_paramedic_user = generate_get_current_user_dep(
    appMediator, roles={UserRole.PARAMEDIC}
)

get_operator_user = generate_get_current_user_dep(
    appMediator, roles={UserRole.OPERATOR}
)


@app.get("/api/v1/medicalCenterRecommendation/{emergencyId}")
async def get_medical_center_recommendations(
    emergencyId: uuid.UUID,
    mediator: Annotated[cqrs.RequestMediator, Depends(get_mediator)],
    user: Annotated[AuthUser, Depends(get_paramedic_user)],
) -> list[MedicalCenter]:
    """Get medical center recommendations for an emergency.

    Args:
        emergencyId: The ID of the emergency
        mediator: The CQRS mediator for handling the query
        user: The authenticated operator user

    Returns:
        List of recommended medical centers

    Raises:
        404: If emergency is not found
        400: If emergency has no location
        400: If emergency has no complexity level
        500: For other internal errors
    """
    query = GetNearbyMedicalCentersForEmergencyQuery(emergencyId=emergencyId)
    try:
        result = await mediator.send(query)
    except EmergencyNotFoundError:
        raise HTTPException(404, {"error": f"emergency {emergencyId} not found"})
    except NoLocationError:
        raise HTTPException(
            400, {"error": f"emergency {emergencyId} has no associated location"}
        )
    except ValueError as e:
        if "complexity level" in str(e):
            raise HTTPException(
                400,
                {"error": f"emergency {emergencyId} has no complexity level assigned"},
            )
        raise HTTPException(400, {"error": str(e)})
    except Exception as e:
        raise HTTPException(500, {"error": f"internal error: {e}"})

    return result.medicalCenters


@app.get("/api/v1/medicalCenterRecommendation")
async def get_all_medical_centers(
    mediator: Annotated[cqrs.RequestMediator, Depends(get_mediator)],
    user: Annotated[AuthUser, Depends(get_operator_user)],
) -> list[MedicalCenter]:
    """Get all medical centers (operators only).

    Args:
        mediator: The CQRS mediator for handling the query
        user: The authenticated operator user

    Returns:
        List of all medical centers

    Raises:
        500: For internal errors
    """
    query = GetAllMedicalCentersQuery()
    try:
        result = await mediator.send(query)
        return result.medicalCenters
    except Exception as e:
        raise HTTPException(500, {"error": f"internal error: {e}"})
