import uuid
from dataclasses import dataclass

from core.domain.value_objects.location import Location


@dataclass
class LocatableResource:
    location: Location
    busy: bool = False


class UnavailableResourceError(Exception):
    id: uuid.UUID

    def __init__(self, resourceId: uuid.UUID, *args: object) -> None:
        self.id = resourceId
        super().__init__(*args)


class BusyResourceError(Exception):
    id: uuid.UUID

    def __init__(self, resourceId: uuid.UUID, *args: object) -> None:
        self.id = resourceId
        super().__init__(*args)
