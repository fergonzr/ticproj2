"""Alert value object module.

This module defines the Alert value object, which is used to hold data
set by a citizen to the system in order to report an emergency.
"""

import datetime

from .location import Location
from .medical_info import MedicalInfo


class Alert:
    """Holds the data that the system receives when an emergency is
    reported"""

    location: Location | None
    generatedOn: datetime.datetime
    medicalInfo: MedicalInfo | None
