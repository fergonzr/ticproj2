"""Use case to retrieve an emergency by its ID from real-time storage.

This module defines the GetEmergencyByIdQuery and its handler to retrieve
emergency information from the real-time storage port.
"""

import uuid
from typing import ClassVar

import cqrs

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import Emergency, EmergencyNotFoundError

from . import DefaultedRequest


class GetEmergencyByIdQuery(DefaultedRequest):
    """Request to retrieve an emergency by its ID.

    This query contains the unique identifier of the emergency to be retrieved.

    Attributes:
        emergencyId: The unique identifier of the emergency to retrieve.
    """

    emergencyId: uuid.UUID


class GetEmergencyByIdQueryResult(cqrs.Response):
    """Result of the GetEmergencyByIdQuery.

    This response contains the emergency that was retrieved from storage.

    Attributes:
        emergency: The Emergency entity that was retrieved.
    """

    emergency: Emergency


class GetEmergencyByIdHandler(
    cqrs.RequestHandler[GetEmergencyByIdQuery, GetEmergencyByIdQueryResult]
):
    """Handler for processing GetEmergencyByIdQuery.

    This handler retrieves an emergency by its ID using the RealTimeStoragePort.

    Attributes:
        realtimeStorage: The real-time storage port to retrieve the emergency.
    """

    def __init__(self, realtimeStorage: RealTimeStoragePort):
        super().__init__()
        self.realtimeStorage = realtimeStorage

    async def handle(
        self, request: GetEmergencyByIdQuery
    ) -> GetEmergencyByIdQueryResult:
        """Handles the get emergency by ID query.

        Args:
            request: The GetEmergencyByIdQuery containing the ID of the emergency to retrieve.

        Returns:
            GetEmergencyByIdQueryResult containing the retrieved emergency.

        Raises:
            EmergencyNotFoundError: If no emergency with the specified ID is found.
        """
        emergency = await self.realtimeStorage.get_emergency(request.emergencyId)

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        return GetEmergencyByIdQueryResult(emergency=emergency)


# Set the default handler for the GetEmergencyByIdQuery
GetEmergencyByIdQuery.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    GetEmergencyByIdHandler
)
