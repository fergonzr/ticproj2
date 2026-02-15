"""Emergency entity module.

This module defines the Emergency entity, which represents a medical emergency
that needs to be handled by paramedics.
"""

from uuid import UUID

from ..value_objects.location import Location
from ..value_objects.medical_info import MedicalInfo
from .paramedic import Paramedic


class Emergency:
    """Represents an emergency situation that needs to be handled.

    An Emergency is created when someone reports a medical emergency and needs
    assistance. It contains location information, optional medical details,
    and can be assigned to a paramedic for handling.

    Attributes:
        id: Unique identifier for the emergency.
        location: The geographical location where the emergency occurred.
        medicalInfo: Optional medical information about the emergency.
        assignedTo: The paramedic assigned to handle this emergency, or None if not assigned.
    """

    id: UUID
    location: Location
    medicalInfo: MedicalInfo | None
    assignedTo: Paramedic | None

    def __init__(self, location, medicalInfo=None):
        """Initializes an Emergency with location and optional medical information.

        Args:
            location: The location where the emergency occurred.
            medicalInfo: Optional medical information about the emergency.
        """
        self.location = location
        self.medicalInfo = medicalInfo
