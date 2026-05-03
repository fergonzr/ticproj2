"""Use case to retrieve operated emergencies for an operator.

This module defines the GetOperatedEmergenciesQuery and its handler
to retrieve all emergencies currently operated by a given operator.
"""

import uuid
from typing import ClassVar

import cqrs

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import Emergency

from . import DefaultedRequest


class GetOperatedEmergenciesQuery(DefaultedRequest):
    """Request to retrieve operated emergencies for an operator.

    This query contains the unique identifier of the operator for which
    operated emergencies should be retrieved.

    Attributes:
        operatorId: The unique identifier of the operator.
    """

    operatorId: uuid.UUID


class GetOperatedEmergenciesQueryResult(cqrs.Response):
    """Result of the GetOperatedEmergenciesQuery.

    This response contains a list of Emergency entities operated by the operator.

    Attributes:
        emergencies: A list of Emergency entities operated by the operator.
    """

    emergencies: list[Emergency]


class GetOperatedEmergenciesHandler(
    cqrs.RequestHandler[
        GetOperatedEmergenciesQuery,
        GetOperatedEmergenciesQueryResult,
    ]
):
    """Handler for processing GetOperatedEmergenciesQuery.

    This handler retrieves operated emergencies for an operator using the RealTimeStoragePort.

    Attributes:
        realtimeStorage: The real-time storage port to retrieve the operated emergencies.
    """

    def __init__(self, realtimeStorage: RealTimeStoragePort):
        super().__init__()
        self.realtimeStorage = realtimeStorage

    # This handler does not generate events
    @property
    def events(self) -> list[cqrs.Event]:
        return []

    def clear_events(self) -> None:
        pass

    async def handle(
        self, request: GetOperatedEmergenciesQuery
    ) -> GetOperatedEmergenciesQueryResult:
        """Handles the get operated emergencies query.

        Args:
            request: The GetOperatedEmergenciesQuery containing the ID of the operator.

        Returns:
            GetOperatedEmergenciesQueryResult containing a list of emergencies
            operated by the specified operator.
        """
        emergencies = await self.realtimeStorage.get_operated_emergencies(
            request.operatorId
        )

        return GetOperatedEmergenciesQueryResult(emergencies=emergencies)


# Set the default handler for the GetOperatedEmergenciesQuery
GetOperatedEmergenciesQuery.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    GetOperatedEmergenciesHandler
)
