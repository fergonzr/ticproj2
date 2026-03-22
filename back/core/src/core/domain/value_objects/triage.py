"""Triage value object module"""

import enum
from dataclasses import dataclass


class PriorityLevel(enum.Enum):
    CRITICAL = "CRITICAL"
    URGENT = "URGENT"
    MEDIUM = "MEDIUM"


@dataclass
class Triage:
    """A value object holding the relevant information to determine
    the priority of an emergency

    TODO: actually implement the fields here
    """
    bleeding: bool
    dizziness: bool
    blurred_vision: bool
    unconscious: bool
    difficulty_breathing: bool
    fracture: bool
    chest_pain: bool
    numbness_limbs: bool


    def get_priority_level(self) -> PriorityLevel:
        """Return the priority level according to the current triage"""
        raise NotImplementedError()
