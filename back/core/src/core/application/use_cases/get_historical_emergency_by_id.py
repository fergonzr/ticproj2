import uuid

import cqrs

from core.application.ports.historical_register import HistoricalRegisterPort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.historical_emergency import (
    HistoricalEmergency,
    HistoricalEmergencyNotFoundError,
)


class GetHistoricalEmergencyByIdQuery(DefaultedRequest):
    emergencyId: uuid.UUID


class GetHistoricalEmergencyByIdQueryResult(cqrs.Response):
    emergency: HistoricalEmergency


class GetHistoricalEmergencyByIdHandler(
    cqrs.RequestHandler[
        GetHistoricalEmergencyByIdQuery, GetHistoricalEmergencyByIdQueryResult
    ]
):
    def __init__(self, historicalRegister: HistoricalRegisterPort):
        self.historicalRegister = historicalRegister

    async def handle(
        self, request: GetHistoricalEmergencyByIdQuery
    ) -> GetHistoricalEmergencyByIdQueryResult:
        """Handle the get historical emergency by ID query"""
        historicalEmergency = await self.historicalRegister.get_emergency(
            request.emergencyId
        )

        if historicalEmergency is None:
            raise HistoricalEmergencyNotFoundError()

        return GetHistoricalEmergencyByIdQueryResult(emergency=historicalEmergency)


GetHistoricalEmergencyByIdQuery.defaultHandler = GetHistoricalEmergencyByIdHandler
