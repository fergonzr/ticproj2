"""Emergency entity module.

This module defines the Emergency entity, which represents a medical emergency
that needs to be handled by paramedics.
"""

import uuid
from datetime import datetime

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

    id: uuid.UUID
    createdOn: datetime
    location: Location
    medicalInfo: MedicalInfo | None
    assignedTo: Paramedic | None

    def __init__(
        self,
        location: Location,
        createdOn: datetime,
        medicalInfo: MedicalInfo = None,
        assignedTo: Paramedic | None = None,
        id: uuid.UUID = uuid.uuid4(),
    ):
        """Initializes an Emergency with location and optional medical information.

        Args:
            location: The location where the emergency occurred.
            medicalInfo: Optional medical information about the emergency.
        """
        self.location = location
        self.medicalInfo = medicalInfo
        self.createdOn = createdOn
        self.assignedTo = assignedTo
        self.id = id

    def to_dict(self):
        """Convert the Emergency object to a dictionary.

        Returns:
            dict: A dictionary representation of the Emergency object.
        """
        data = {
            "id": str(self.id),
            "createdOn": self.createdOn.isoformat(),
            "location": self.location.to_dict()
            if hasattr(self.location, "to_dict")
            else vars(self.location),
            "medicalInfo": self.medicalInfo.to_dict()
            if self.medicalInfo and hasattr(self.medicalInfo, "to_dict")
            else vars(self.medicalInfo)
            if self.medicalInfo
            else None,
            "assignedTo": self.assignedTo.to_dict()
            if self.assignedTo and hasattr(self.assignedTo, "to_dict")
            else vars(self.assignedTo)
            if self.assignedTo
            else None,
        }
        return data
