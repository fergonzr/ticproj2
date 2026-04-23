"""Alert value object module.

This module defines the Alert value object, which is used to hold data
set by a citizen to the system in order to report an emergency.
"""

import datetime
from dataclasses import dataclass

from .location import Location
from .medical_info import MedicalInfo


class NoLocationError(Exception):
    """An error to be raised when executing an operation that requires
    an Alert to have a non-null location field is called when this is
    not the case."""

    pass


@dataclass
class Alert:
    """Holds the data that the system receives when an emergency is
    reported"""

    location: Location | None
    generatedOn: datetime.datetime
    medicalInfo: MedicalInfo | None
    editedOn: datetime.datetime | None = None

    def edit(self, location: Location | None, medicalInfo: MedicalInfo | None):
        self.location = location
        self.medicalInfo = medicalInfo

        self.editedOn = datetime.datetime.now()
