import uuid
from datetime import datetime
from typing import AsyncIterator

import cqrs

from core.application.ports.historical_register import HistoricalRegisterPort
from core.application.use_cases import DefaultedRequest, StreamingDefaultedRequest
from core.domain.entities.historical_emergency import (
    HistoricalEmergency,
    HistoricalEmergencyNotFoundError,
)


class GetHistoricalEmergencyByDateQuery(StreamingDefaultedRequest):
    since: datetime
    to: datetime


class GetHistoricalEmergencyByDateQueryResult(cqrs.Response):
    historicalEmergency: HistoricalEmergency


class GetHistoricalEmergencyByDateHandler(
    cqrs.StreamingRequestHandler[
        GetHistoricalEmergencyByDateQuery, GetHistoricalEmergencyByDateQueryResult
    ]
):
    def __init__(self, historicalRegister: HistoricalRegisterPort):
        self.historicalRegister = historicalRegister

    async def handle(
        self, request: GetHistoricalEmergencyByDateQuery
    ) -> AsyncIterator[GetHistoricalEmergencyByDateQueryResult]:
        """Handle the get historical emergency by ID query"""

        async for emergency in self.historicalRegister.get_emergencies_in_daterange(
            request.since, request.to
        ):
            yield GetHistoricalEmergencyByDateQueryResult(historicalEmergency=emergency)


GetHistoricalEmergencyByDateQuery.defaultHandler = GetHistoricalEmergencyByDateHandler
