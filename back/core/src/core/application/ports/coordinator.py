"""Coordinator port module.

This module defines the CoordinatorPort interface for handling emergency
reporting and coordination between the interested parties.
"""

from core.domain.entities.emergency import Emergency
from core.domain.entities.user import Paramedic

from . import Port


class CoordinatorPort(Port):
    """Interface for emergency coordination functionality within the
    Coordinator service itself.

    This port provides methods for reporting emergencies and coordinating
    response efforts. Implementations will handle the actual coordination
    logic and communication with other services. Implementors should
    run on the same process of the coordinator, providing this
    interface as callback. That means this port MUST NOT be used for
    communication from external services to the Coordinator service.
    """

    async def report_emergency(self, emergency: Emergency):
        """Reports an emergency to the coordination system.

        Args:
            emergency: The Emergency entity containing the emergency details.

        Raises:
            NotImplementedError: This method must be implemented by subclasses.
        """
        raise NotImplementedError

    async def report_triage(self, emergency: Emergency):
        """Reports the triaging of an emergency to the coordination system.

        Args:
            emergency: The emergency entitty that has been triaged.
        """
        raise NotImplementedError

    async def report_assignment(self, emergency: Emergency, paramedic: Paramedic):
        """Report the assignment of an emergency to the coordination system.

        Args:
            emergency: The Emergency entity that was assigned
            paramedic: The Paramedic that the Emergency was assigned to.
        """
        raise NotImplementedError

    async def report_arrival(self, emergency: Emergency):
        """Report the arrival of paramedics to an emergency site.

        Args:
            emergency: The Emergency entity where paramedics have arrived.
        """
        raise NotImplementedError
