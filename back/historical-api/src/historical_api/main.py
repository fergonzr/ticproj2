"""REST API to get the historical register of emergencies and related data"""

import logging
import uuid
from datetime import datetime
from typing import Annotated, AsyncIterable, Dict, Tuple

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
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, status
from sie_auth import AuthUser, generate_get_current_user_dep

from .models import Statistics
from .stats import (
    CALCULATE_INTERSECT_PROPORTION_THRESHOLD,
    RECALCULATE_INTERSECT_PROPORTION_THRESHOLD,
    NoStatisticsError,
    StatisticsHolder,
)

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

statisticsHolder = StatisticsHolder()


async def compute_statistics(since: datetime, to: datetime) -> Statistics:
    iterator = streamingMediator.stream(
        GetHistoricalEmergencyByDateQuery(since=since, to=to)
    )

    emergencies = [
        result.historicalEmergency
        async for result in iterator
        if result is not None
        and isinstance(result, GetHistoricalEmergencyByDateQueryResult)
    ]
    return statisticsHolder.compute_statistics(emergencies, since, to)


@app.get("/api/v1/historic/statistics")
async def get_statistics(
    analystUser: Annotated[AuthUser, Depends(get_analyst_user)],
    since: datetime,
    to: datetime,
    backgroundTasks: BackgroundTasks,
) -> Statistics:
    """Retrieve the statitics for the given time range"""
    try:
        statistics, intersectProportion = statisticsHolder.retrieve_statistics(
            since, to
        )

        # Need to calculate the statistics right away, because no
        # single interval is representative
        if intersectProportion < CALCULATE_INTERSECT_PROPORTION_THRESHOLD:
            logger.info(f"Computing statistics {since}-{to} right now")
            return await compute_statistics(since, to)

        # We can return representative statistics but we're going to
        # eagerly compute the given range on the background for next time
        if intersectProportion < RECALCULATE_INTERSECT_PROPORTION_THRESHOLD:
            logger.info(f"Computing statistics {since}-{to} afterwards")
            backgroundTasks.add_task(compute_statistics, since, to)

        return statistics
    except NoStatisticsError:
        logger.info(f"Computing statistics {since}-{to} for the first time")
        return await compute_statistics(since, to)


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
    if since > to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date range provided: {since} - {to}",
        )

    iterator = streamingMediator.stream(
        GetHistoricalEmergencyByDateQuery(since=since, to=to)
    )

    async for result in iterator:
        if result is not None and isinstance(
            result, GetHistoricalEmergencyByDateQueryResult
        ):
            yield result.historicalEmergency
