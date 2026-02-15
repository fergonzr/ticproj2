"""Medical information value object module.

This module defines the MedicalInfo value object, which represents medical
information related to emergencies.
"""

from pydantic import BaseModel


class MedicalInfo(BaseModel):
    """Value object representing medical information about an emergency.

    This value object encapsulates medical details related to an emergency,
    such as symptoms, conditions, or other relevant medical information.
    It uses Pydantic's BaseModel for validation and serialization.

    Attributes:
        # Add specific medical information attributes as needed
        # For example:
        # symptoms: str | None = None
        # condition: str | None = None
        # urgency: str | None = None
    """

    pass
