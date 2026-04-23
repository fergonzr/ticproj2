"""Use case to retrieve nearby medical centers for an emergency.

This module defines the GetNearbyMedicalCentersForEmergencyQuery and its handler
to retrieve nearby medical centers based on an emergency's location and complexity level.
"""

import uuid
from typing import ClassVar

import cqrs

from core.application.ports.medical_center_manager import MedicalCenterManagerPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import EmergencyNotFoundError
from core.domain.value_objects.alert import NoLocationError

from . import DefaultedRequest


class GetNearbyMedicalCentersForEmergencyQuery(DefaultedRequest):
    """Request to retrieve nearby medical centers for an emergency.

    This query contains the unique identifier of the emergency for which
    nearby medical centers should be retrieved.

    Attributes:
        emergencyId: The unique identifier of the emergency.
    """

    emergencyId: uuid.UUID


class GetNearbyMedicalCentersForEmergencyQueryResult(cqrs.Response):
    """Result of the GetNearbyMedicalCentersForEmergencyQuery.

    This response contains a list of medical centers near the emergency location
    that can handle the emergency's complexity level.

    Attributes:
        medicalCenters: A list of MedicalCenter entities near the emergency.
    """

    medicalCenters: list


class GetNearbyMedicalCentersForEmergencyHandler(
    cqrs.RequestHandler[
        GetNearbyMedicalCentersForEmergencyQuery,
        GetNearbyMedicalCentersForEmergencyQueryResult,
    ]
):
    """Handler for processing GetNearbyMedicalCentersForEmergencyQuery.

    This handler retrieves nearby medical centers for an emergency using the
    RealTimeStoragePort to get the emergency details and the MedicalCenterManagerPort
    to find suitable medical centers.

    Attributes:
        realtimeStorage: The real-time storage port to retrieve the emergency.
        medicalCenterManager: The medical center manager port to find nearby medical centers.
    """

    def __init__(
        self,
        realtimeStorage: RealTimeStoragePort,
        medicalCenterManager: MedicalCenterManagerPort,
    ):
        super().__init__()
        self.realtimeStorage = realtimeStorage
        self.medicalCenterManager = medicalCenterManager

    # This handler does not generate events
    @property
    def events(self) -> list[cqrs.Event]:
        return []

    def clear_events(self) -> None:
        pass

    async def handle(
        self, request: GetNearbyMedicalCentersForEmergencyQuery
    ) -> GetNearbyMedicalCentersForEmergencyQueryResult:
        """Handles the get nearby medical centers for emergency query.

        Args:
            request: The GetNearbyMedicalCentersForEmergencyQuery containing the ID of the emergency.

        Returns:
            GetNearbyMedicalCentersForEmergencyQueryResult containing a list of medical centers

        Raises:
            EmergencyNotFoundError: If no emergency with the specified ID is found.
            NoLocationError: If the emergency has no location information.
            ValueError: If the emergency has no complexity level assigned.
        """
        emergency = await self.realtimeStorage.get_emergency(request.emergencyId)

        if emergency is None:
            raise EmergencyNotFoundError(request.emergencyId)

        if emergency.alert.location is None:
            raise NoLocationError()

        if emergency.complexityLevel is None:
            raise ValueError("Emergency has no complexity level assigned")

        medical_centers = await self.medicalCenterManager.get_nearby_medical_center(
            emergency.alert.location, emergency.complexityLevel
        )

        return GetNearbyMedicalCentersForEmergencyQueryResult(
            medicalCenters=medical_centers
        )


# Set the default handler for the GetNearbyMedicalCentersForEmergencyQuery
GetNearbyMedicalCentersForEmergencyQuery.defaultHandler: ClassVar[
    type[cqrs.RequestHandler]
] = GetNearbyMedicalCentersForEmergencyHandler
