import enum
import uuid
from dataclasses import dataclass

from ..value_objects.location import Location


class ComplexityLevel(enum.Enum):
    """A measure of how difficult it is to provide medical assistance
    for a given emergency."""

    BASIC = 0
    INTERMEDIATE = 1
    HIGH = 2


@dataclass
class MedicalCenter:
    """A medical center where citizens affected by emergencies can be
    attended.

    Attributes:
        id: The unique identifier of the medical center
        name: The name of the medical center
        phone: The contact phone of the medical center
        maxComplexityLevel: The highest ComplexityLevel that this
            medical center can handle
        specialties: A list of special medical services this medical
            center offers.
        availableSlots: The number of available patient slots on the
            medical center, if at all reported.
        location: The geographical Location of the medical center
    """

    id: uuid.UUID
    name: str
    phone: str
    maxComplexityLevel: ComplexityLevel
    specialties: list[str]
    availableSlots: int | None
    location: Location
