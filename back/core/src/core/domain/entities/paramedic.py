"""Paramedic entity module.

This module defines the Paramedic domain entity, which represents a paramedic
who can be assigned to handle emergencies.
"""

from uuid import UUID


class Paramedic:
    """Represents a paramedic who can handle emergencies.

    A Paramedic is a medical professional who can be assigned to emergencies
    and provide medical assistance. Each paramedic has a unique identifier,
    name, and contact email.

    Attributes:
        id: Unique identifier for the paramedic.
        name: The full name of the paramedic.
        email: The email address for contacting the paramedic.
    """

    id: UUID
    name: str
    email: str
