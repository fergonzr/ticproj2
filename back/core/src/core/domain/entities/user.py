"""User entities module.

This module defines the Paramedic domain entity, which represents a paramedic
who can be assigned to handle emergencies.
"""

from abc import ABC
from dataclasses import dataclass
from uuid import UUID

from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource


@dataclass
class User(ABC):
    id: UUID
    name: str
    email: str


class Paramedic(User):
    """Represents a paramedic who can handle emergencies.

    A Paramedic is a medical professional who can be assigned to emergencies
    and provide medical assistance. Each paramedic has a unique identifier,
    name, and contact email.

    Attributes:
        id: Unique identifier for the paramedic.
        name: The full name of the paramedic.
        email: The email address for contacting the paramedic.
    """

    resource: LocatableResource | None

    def update_location(self, newLocation: Location):
        if self.resource is not None:
            self.resource.location = newLocation


class UserNotFoundError(LookupError):
    userId: UUID

    def __init__(self, userId: UUID, *args: object) -> None:
        self.userId = userId
        super().__init__(*args)
