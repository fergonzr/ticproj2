"""Medical information value object module.

This module defines the MedicalInfo value object, which represents medical
information related to emergencies.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class DocumentType(str, Enum):
    NATIONAL_ID = "NATIONAL_ID"
    PASSPORT = "PASSPORT"
    IDENTITY_CARD = "IDENTITY_CARD"


class BloodType(str, Enum):
    O_POSITIVE = "O_POSITIVE"
    O_NEGATIVE = "O_NEGATIVE"
    A_POSITIVE = "A_POSITIVE"
    A_NEGATIVE = "A_NEGATIVE"
    B_POSITIVE = "B_POSITIVE"
    B_NEGATIVE = "B_NEGATIVE"
    AB_POSITIVE = "AB_POSITIVE"
    AB_NEGATIVE = "AB_NEGATIVE"


@dataclass
class MedicalInfo:
    """Value object representing medical information about a citizen.

    Attributes:
        firstName: First name of the person.
        lastName: Last name(s) of the person.
        phone: 10-digit phone number.
        documentType: Type of ID document.
        documentNumber: The document number.
        age: Age in years as a string.
        allergies: List of allergy descriptions. Empty list if none.
        diseases: List of disease/condition descriptions. Empty list if none.
        hasPacemaker: Whether the person has a pacemaker. Defaults to False.
        bloodType: Blood type.
    """

    firstName: str
    lastName: str
    phone: str
    documentType: DocumentType
    documentNumber: str
    age: str
    bloodType: BloodType
    allergies: list[str] = field(default_factory=list)
    diseases: list[str] = field(default_factory=list)
    hasPacemaker: bool = False
