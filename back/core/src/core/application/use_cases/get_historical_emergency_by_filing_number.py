import uuid

import cqrs

from core.application.ports.historical_register import HistoricalRegisterPort
from core.application.use_cases import DefaultedRequest
from core.domain.entities.historical_emergency import (
    HistoricalEmergency,
    HistoricalEmergencyNotFoundError,
)


class GetHistoricalEmergencyByFilingNumberQuery(DefaultedRequest):
    filingNumber: int


class GetHistoricalEmergencyByFilingNumberQueryResult(cqrs.Response):
    emergency: HistoricalEmergency


class GetHistoricalEmergencyByFilingNumberHandler(
    cqrs.RequestHandler[
        GetHistoricalEmergencyByFilingNumberQuery,
        GetHistoricalEmergencyByFilingNumberQueryResult,
    ]
):
    def __init__(self, historicalRegister: HistoricalRegisterPort):
        self.historicalRegister = historicalRegister

    async def handle(
        self, request: GetHistoricalEmergencyByFilingNumberQuery
    ) -> GetHistoricalEmergencyByFilingNumberQueryResult:
        """Handle the get historical emergency by ID query"""
        historicalEmergency = (
            await self.historicalRegister.get_emergency_by_filing_number(
                request.filingNumber
            )
        )

        if historicalEmergency is None:
            raise HistoricalEmergencyNotFoundError()

        return GetHistoricalEmergencyByFilingNumberQueryResult(
            emergency=historicalEmergency
        )


GetHistoricalEmergencyByFilingNumberQuery.defaultHandler = (
    GetHistoricalEmergencyByFilingNumberHandler
)
