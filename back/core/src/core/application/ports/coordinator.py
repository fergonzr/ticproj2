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

    async def report_alert_edited(self, emergency: Emergency):
        """Report that the alert field of an emergency has been edited.

        Args:
            emergency: The Emergency entity whose alert has been edited.
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

    async def report_complexity_assignment(self, emergency: Emergency):
        """Report the assignment of a complexity level (retriage) of an emergency.

        Args:
            emergency: The Emergency entity whose compelixty level has been assingned.
        """
        raise NotImplementedError

    async def report_resolution(self, emergency: Emergency):
        """Report the resolution of an emergency.

        Args:
            emergency: The Emergency entity that has been resolved.
        """
        raise NotImplementedError

    async def report_closing(self, emergency: Emergency):
        """Report the closing of an emergency.

        Args:
            emergency: The Emergency entity that has been closed.
        """
        raise NotImplementedError

    async def report_cancel(self, emergency: Emergency):
        """Report the cancelling of this emergency

        Args:
            emergency: The Emergency entity that has been cancelled
        """
        raise NotImplementedError

    async def report_assignment_cancelled(self, emergency: Emergency):
        """Report the cancelling of this emergency

        Args:
            emergency: The Emergency entity that has been cancelled
        """
        raise NotImplementedError

    async def report_transfer(self, emergency: Emergency):
        """Report the transfer of an emergency to a medical center.

        Args:
            emergency: The Emergency entity that has been transferred to a medical center.
        """
        raise NotImplementedError

    async def report_operation(self, emergency: Emergency):
        """Report the assingment of the emergency by an operator.

        Args:
            emergency: The emergency entitye that an operator assigned to iself.
        """
        raise NotImplementedError

    async def report_prehospital_care_reported(self, emergency: Emergency):
        """Report that prehospital care has been reported for an emergency.

        Args:
            emergency: The Emergency entity for which prehospital care was reported.
        """
        raise NotImplementedError
