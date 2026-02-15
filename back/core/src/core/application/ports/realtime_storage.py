"""Real-time storage port module.

This module defines the RealTimeStoragePort interface for persisting emergency
data in real-time.
"""

from core.domain.entities.emergency import Emergency

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
