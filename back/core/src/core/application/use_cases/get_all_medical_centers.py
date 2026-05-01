"""Use case to retrieve all medical centers.

This module defines the GetAllMedicalCentersQuery and its handler
to retrieve all available medical centers.
"""

from typing import ClassVar

import cqrs

from core.application.ports.medical_center_manager import MedicalCenterManagerPort

from . import DefaultedRequest


class GetAllMedicalCentersQuery(DefaultedRequest):
    """Request to retrieve all medical centers.

    This query does not require any parameters as it retrieves
    all available medical centers.
    """

    pass


class GetAllMedicalCentersQueryResult(cqrs.Response):
    """Result of the GetAllMedicalCentersQuery.

    This response contains a list of all medical centers.

    Attributes:
        medicalCenters: A list of all MedicalCenter entities.
    """

    medicalCenters: list


class GetAllMedicalCentersHandler(
    cqrs.RequestHandler[
        GetAllMedicalCentersQuery,
        GetAllMedicalCentersQueryResult,
    ]
):
    """Handler for processing GetAllMedicalCentersQuery.

    This handler retrieves all medical centers using the
    MedicalCenterManagerPort.

    Attributes:
        medicalCenterManager: The medical center manager port to get all medical centers.
    """

    def __init__(
        self,
        medicalCenterManager: MedicalCenterManagerPort,
    ):
        super().__init__()
        self.medicalCenterManager = medicalCenterManager

    # This handler does not generate events
    @property
    def events(self) -> list[cqrs.Event]:
        return []

    def clear_events(self) -> None:
        pass

    async def handle(
        self, request: GetAllMedicalCentersQuery
    ) -> GetAllMedicalCentersQueryResult:
        """Handles the get all medical centers query.

        Args:
            request: The GetAllMedicalCentersQuery (no parameters needed).

        Returns:
            GetAllMedicalCentersQueryResult containing a list of all medical centers.
        """
        medical_centers = await self.medicalCenterManager.get_all_medical_centers()

        return GetAllMedicalCentersQueryResult(medicalCenters=medical_centers)


# Set the default handler for the GetAllMedicalCentersQuery
GetAllMedicalCentersQuery.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    GetAllMedicalCentersHandler
)
