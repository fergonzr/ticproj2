"""Real-time storage port module.

This module defines the RealTimeStoragePort interface for persisting emergency
data in real-time.
"""

import uuid

from core.domain.entities.emergency import Emergency
from core.domain.entities.user import Paramedic
from core.domain.value_objects.location import Location

from .port import Port


class RealTimeStoragePort(Port):
    """Interface for real-time storage of emergency data.

    This port provides asynchronous methods for saving emergency information
    to persistent storage. Implementations should handle the actual storage
    operations.
    """

    async def save_emergency(self, emergency: Emergency):
        """Saves emergency data to persistent storage.

        Args:
            emergency: The Emergency entity containing the data to be saved.

        Raises:
            NotImplementedError: This method must be implemented by subclasses.
        """
        raise NotImplementedError

    async def get_paramedic(
        self, paramedicId: uuid.UUID, coarseLocation: Location
    ) -> Paramedic | None:
        """Get the information of an active paramedic on the realtime storage database.

        Args:
            paramedicId: The unique identifier of the paramedic wer're looking for.
            coarseLocation: An approximate location of the paramedic
            we are searching for, to speed up the query via LSH.

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

    async def delete_paramedic(
        self, paramedicId: uuid.UUID, coarseLocation: Location
    ) -> Paramedic | None:
        """Delete an active paramedic on the realtime storage database.

        Args:
            paramedicId: The unique identifier of the paramedic wer're looking to delete.
            coarseLocation: An approximate location of the paramedic
            we are searching for, to speed up the query via LSH.

        Returns:
            Paramedic filled with its details, None if no matching
            entry was found on the database.
        """
        raise NotImplementedError
