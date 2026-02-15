"""Coordinator port module.

This module defines the CoordinatorPort interface for handling emergency
reporting and coordination between the interested parties.
"""

from core.domain.entities.emergency import Emergency

from . import Port


class CoordinatorPort(Port):
    """Interface for emergency coordination functionality.

    This port provides methods for reporting emergencies and coordinating
    response efforts. Implementations will handle the actual coordination
    logic and communication with other services.
    """

    async def report_emergency(self, emergency: Emergency):
        """Reports an emergency to the coordination system.

        Args:
            emergency: The Emergency entity containing the emergency details.

        Raises:
            NotImplementedError: This method must be implemented by subclasses.
        """
        raise NotImplementedError
