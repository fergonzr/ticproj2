"""User entities module.

This module defines the Paramedic domain entity, which represents a paramedic
who can be assigned to handle emergencies.
"""

import enum
import uuid
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import (
    BusyResourceError,
    LocatableResource,
    UnavailableResourceError,
)


class UserRole(enum.Enum):
    PARAMEDIC = "PARAMEDIC"
    OPERATOR = "OPERATOR"


@dataclass
class User:
    id: UUID
    name: str
    email: str
    passwordHash: str
    userRole: UserRole


# Deliberately choosing not to inherit because of some serialization
# class discovery shenaningans. Don't ask why.


@dataclass
class Paramedic:
    """Represents a paramedic who can handle emergencies.

    A Paramedic is a medical professional who can be assigned to emergencies
    and provide medical assistance. Each paramedic has a unique identifier,
    name, and contact email.

    Attributes:
        id: Unique identifier for the paramedic.
        name: The full name of the paramedic.
        email: The email address for contacting the paramedic.
        resource: The resource associated with this paramedic.
        assignedEmergencyId: The ID of the emergency this paramedic is assigned to.
    """

    id: UUID
    name: str
    email: str
    passwordHash: str
    userRole: UserRole = UserRole.PARAMEDIC
    resource: LocatableResource | None = None
    assignedEmergencyId: UUID | None = None

    def as_user(self):
        return User(
            id=self.id,
            name=self.name,
            email=self.email,
            passwordHash=self.passwordHash,
            userRole=self.userRole,
        )

    def update_location(self, newLocation: Location):
        if self.resource is not None:
            self.resource.location = newLocation
        else:
            self.resource = LocatableResource(newLocation)

    def assign(self, emergencyId: UUID):
        if self.resource is None:
            raise UnavailableResourceError(self.id)

        if self.resource.busy:
            raise BusyResourceError(self.id)

        self.resource.busy = True
        self.assignedEmergencyId = emergencyId

    def release(self):
        if self.resource is not None:
            self.resource.busy = False

        self.assignedEmergencyId = None


class UserNotFoundError(LookupError):
    userId: UUID | None

    def __init__(self, userId: UUID | None = None, *args: object) -> None:
        self.userId = userId
        super().__init__(*args)


class UnexpectedUserRoleError(ValueError):
    actualRole: UserRole
    requiredRole: UserRole

    def __init__(self, actualRole: UserRole, requiredRole: UserRole):
        self.actualRole = actualRole
        self.requiredRole = requiredRole
