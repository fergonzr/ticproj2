from dataclasses import dataclass

from core.domain.value_objects.location import Location


@dataclass
class LocatableResource:
    location: Location
    busy: bool = False
