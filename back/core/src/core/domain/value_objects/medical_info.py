"""Medical information value object module.

This module defines the MedicalInfo value object, which represents medical
information related to emergencies.
"""

from dataclasses import dataclass, field
from typing import Optional
from pydantic import BaseModel


@dataclass
class MedicalInfo(BaseModel):
    """Value object representing medical information about a citizen.

    Attributes:
        first_name: First name of the person.
        last_name: Last name(s) of the person.
        phone: 10-digit phone number.
        document_type: Type of ID document (e.g. NATIONAL_ID, PASSPORT).
        document_number: The document number.
        age: Age in years as a string.
        allergies: List of allergy descriptions. Empty list if none.
        diseases: List of disease/condition descriptions. Empty list if none.
        has_pacemaker: Whether the person has a pacemaker. None if not answered.
        blood_type: Blood type key (e.g. O_POSITIVE, A_NEGATIVE).
        data_consent: Whether the person authorized use of their data.
    """
    first_name: str
    last_name: str
    phone: str
    document_type: str
    document_number: str
    age: str
    blood_type: str
    data_consent: bool
    allergies: Optional[list[str]] = field(default_factory=list)
    diseases: Optional[list[str]] = field(default_factory=list)
    has_pacemaker: Optional[bool] = None
