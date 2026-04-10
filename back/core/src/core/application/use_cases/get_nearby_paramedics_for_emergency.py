"""Use case to retrieve nearby paramedics for an emergency.

This module defines the GetNearbyParamedicsForEmergencyQuery and its handler
to retrieve nearby paramedics based on an emergency's location.
"""

import uuid
from typing import AsyncIterator, ClassVar

import cqrs

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import Emergency, EmergencyNotFoundError
from core.domain.entities.user import Paramedic
from core.domain.value_objects.alert import NoLocationError
from core.domain.value_objects.resource import LocatableResource

from . import DefaultedRequest


class GetNearbyParamedicsForEmergencyQuery(DefaultedRequest):
    """Request to retrieve nearby paramedics for an emergency.

    This query contains the unique identifier of the emergency for which
    nearby paramedics should be retrieved.

    Attributes:
        emergencyId: The unique identifier of the emergency.
    """

    emergencyId: uuid.UUID


class GetNearbyParamedicsForEmergencyQueryResult(cqrs.Response):
    """Result of the GetNearbyParamedicsForEmergencyQuery.

    This response contains an async generator of paramedics near the emergency location.

    Attributes:
        paramedics: An async generator of Paramedic entities near the emergency.
    """

    paramedics: list[Paramedic]


class GetNearbyParamedicsForEmergencyHandler(
    cqrs.RequestHandler[
        GetNearbyParamedicsForEmergencyQuery,
        GetNearbyParamedicsForEmergencyQueryResult,
    ]
):
    """Handler for processing GetNearbyParamedicsForEmergencyQuery.

    This handler retrieves nearby paramedics for an emergency using the RealTimeStoragePort.

    Attributes:
        realtimeStorage: The real-time storage port to retrieve the emergency and paramedics.
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
        self, request: GetNearbyParamedicsForEmergencyQuery
    ) -> GetNearbyParamedicsForEmergencyQueryResult:
        """Handles the get nearby paramedics for emergency query.

        Args:
            request: The GetNearbyParamedicsForEmergencyQuery containing the ID of the emergency.

        Returns:
            GetNearbyParamedicsForEmergencyQueryResult containing a list of paramedics

        Raises:
            EmergencyNotFoundError: If no emergency with the specified ID is found.
        """
        emergency = await self.realtimeStorage.get_emergency(request.emergencyId)

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        if emergency.alert.location is None:
            raise NoLocationError()

        paramedics = await self.realtimeStorage.get_nearby_paramedics(
            emergency.alert.location
        )

        # Filter the paramedics by their busy state
        paramedics = [
            paramedic
            for paramedic in paramedics
            if paramedic.assignedEmergencyId is None
            and paramedic.resource is not None
            and not paramedic.resource.busy
        ]

        return GetNearbyParamedicsForEmergencyQueryResult(paramedics=paramedics)


# Set the default handler for the GetNearbyParamedicsForEmergencyQuery
GetNearbyParamedicsForEmergencyQuery.defaultHandler: ClassVar[
    type[cqrs.RequestHandler]
] = GetNearbyParamedicsForEmergencyHandler
