"""Real-time storage port module.

This module defines the RealTimeStoragePort interface for persisting emergency
data in real-time.
"""

import uuid
from datetime import datetime
from typing import AsyncGenerator

from core.domain.entities.emergency import Emergency
from core.domain.entities.user import Paramedic
from core.domain.value_objects.location import Location

from .port import Port


class RealTimeStoragePort(Port):
    """Interface for real-time storage of emergency data.

    This port provides asynchronous methods for saving emergency information
    to realtime (generally volatile) storage. Implementations should
    handle the actual storage operations.
    """

    async def save_emergency(self, emergency: Emergency):
        """Saves emergency data to persistent storage. This is an
        upsert operation matched by the emergency's id field.

        Args:
            emergency: The Emergency entity containing the data to be saved.

        Raises:
            NotImplementedError: This method must be implemented by subclasses.
        """
        raise NotImplementedError

    async def delete_emergency(self, emergencyId: uuid.UUID) -> Emergency | None:
        """Delete an emergency from the realtime storage database"""
        raise NotImplementedError

    async def get_emergency(self, emergencyId: uuid.UUID) -> Emergency | None:
        """Get an emergengency from the realtime storage database
        based on its emergencyId

        Args:
            emergencyId: The unique identifier of the emergency.

        Returns:
            The Emergency object with the specified createdOn value,
            or None if no matching Emergency was found.
        """
        raise NotImplementedError

    async def get_paramedic(self, paramedicId: uuid.UUID) -> Paramedic | None:
        """Get the information of an active paramedic on the realtime storage database.

        Args:
            paramedicId: The unique identifier of the paramedic wer're looking for.

        Returns:
            Paramedic filled with its details, None if no matching
            entry was found on the database.
        """
        raise NotImplementedError

    async def save_paramedic(self, paramedic: Paramedic):
        """Save a paramedic into the database

        Args:
            paramedic: The paramedic user to save
        """
        raise NotImplementedError

    async def delete_paramedic(self, paramedicId: uuid.UUID) -> Paramedic | None:
        """Delete an active paramedic on the realtime storage database.

        Args:
            paramedicId: The unique identifier of the paramedic wer're looking to delete.

        Returns:
            Paramedic filled with its details, None if no matching
            entry was found on the database.
        """
        raise NotImplementedError

    async def get_nearby_paramedics(self, location: Location) -> list[Paramedic]:
        """Get all the paramedics that are near a given location, closest first

        Args:
            location: Location where the paramedic is required.

        Returs:
            A list of unallocated Paramedic objects closest to the given location
        """

        raise NotImplementedError

    async def get_all_paramedics(self) -> list[Paramedic]:
        """Get every paramedic currently registered in the realtime storage,
        regardless of their resource state or assignment. Callers are expected
        to filter by availability (e.g., resource is not None, not busy,
        assignedEmergencyId is None) when surfacing this to an operator.

        Returns:
            A list of all Paramedic entries in the realtime storage.
        """
        raise NotImplementedError

    async def save_operated_emergencies(
        self, operatorId: uuid.UUID, emergencyIds: list[uuid.UUID]
    ):
        """Save all emergencies currently operated by a given operator

        Args:
            operatorId: The id of the operator.
            emergencyIds: The emergency id's that the operator is
            operating.
        """
        raise NotImplementedError

    async def get_operated_emergencies(self, operatorId: uuid.UUID) -> list[Emergency]:
        """Get all emergencies currently operated by a given operator.

        Args:
            operatorId: The id of the operator
        """
        raise NotImplementedError
