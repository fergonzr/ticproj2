"""REST API to get the historical register of emergencies and related data"""

import logging
import uuid
from datetime import datetime
from typing import Annotated, AsyncIterable

import cqrs
from core.application.factories import create_mediator, create_streaming_mediator
from core.application.use_cases.get_historical_emergency_by_date import (
    GetHistoricalEmergencyByDateQuery,
    GetHistoricalEmergencyByDateQueryResult,
)
from core.application.use_cases.get_historical_emergency_by_filing_number import (
    GetHistoricalEmergencyByFilingNumberQuery,
)
from core.application.use_cases.get_historical_emergency_by_id import (
    GetHistoricalEmergencyByIdQuery,
)
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.domain.entities.historical_emergency import (
    HistoricalEmergency,
    HistoricalEmergencyNotFoundError,
)
from core.domain.entities.user import UserRole
from docker_discovery import DockerServiceDiscoveryAdapter
from fastapi import Depends, FastAPI, HTTPException, status
from sie_auth import AuthUser, generate_get_current_user_dep

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

discoveryAdapter = DockerServiceDiscoveryAdapter("docker-compose.yaml")
appMediator: cqrs.RequestMediator = create_mediator(
    discoveryAdapter,
    useCases=[
        GetUserByEmailQuery,
        GetHistoricalEmergencyByIdQuery,
        GetHistoricalEmergencyByFilingNumberQuery,
    ],
)

streamingMediator: cqrs.StreamingRequestMediator = create_streaming_mediator(
    discoveryAdapter,
    useCases=[GetHistoricalEmergencyByDateQuery],
)


app = FastAPI()

get_analyst_user = generate_get_current_user_dep(appMediator, {UserRole.ANALYST})


@app.get("/api/v1/historic/emergency/{emergencyId}")
async def get_historic_emergency_by_id(
    emergencyId: uuid.UUID, analystUser: Annotated[AuthUser, Depends(get_analyst_user)]
) -> HistoricalEmergency:
    """Retrieve a single historical emergency from the historical
    register, by its id.

    Args:
        emergencyId: id of the historical emergency to retrieve.
        analystUser: An analyst user, injected by the dependency.

    Returs:
        HistoricalEmergency information.
    """

    try:
        response = await appMediator.send(
            GetHistoricalEmergencyByIdQuery(emergencyId=emergencyId)
        )
    except HistoricalEmergencyNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No historic emergency found with id {emergencyId}",
        )

    return response.emergency


@app.get("/api/v1/historic/emergency/by-filing-number/{filingNo}")
async def get_historic_emergency_by_filing_number(
    filingNo: int, analystUser: Annotated[AuthUser, Depends(get_analyst_user)]
) -> HistoricalEmergency:
    """Retrieve a single historical emergency from the historical
    register, by its filing number.

    args:
        filingNo: the filing number of the emergency to retrieve.
        analystUser: An analyst user, injected by the dependency.

    Returns:
        HistoricalEmergency information.
    """
    try:
        response = await appMediator.send(
            GetHistoricalEmergencyByFilingNumberQuery(filingNumber=filingNo)
        )
    except HistoricalEmergencyNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No historic emergency found with filing number {filingNo}",
        )

    return response.emergency


@app.get("/api/v1/historic/emergency")
async def stream_historic_emergency_daterange(
    analystUser: Annotated[AuthUser, Depends(get_analyst_user)],
    since: datetime,
    to: datetime = datetime.now(),
) -> AsyncIterable[HistoricalEmergency]:
    iterator = streamingMediator.stream(
        GetHistoricalEmergencyByDateQuery(since=since, to=to)
    )

    if since > to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date range provided: {since} - {to}",
        )

    async for result in iterator:
        if result is not None and isinstance(
            result, GetHistoricalEmergencyByDateQueryResult
        ):
            yield result.historicalEmergency
