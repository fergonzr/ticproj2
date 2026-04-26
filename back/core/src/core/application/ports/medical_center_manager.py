import uuid

from core.domain.entities.medical_center import ComplexityLevel, MedicalCenter
from core.domain.value_objects.location import Location

from . import Port


class MedicalCenterManagerPort(Port):
    """A port to query information about medical centers"""

    async def get_medical_center_by_id(self, id: uuid.UUID) -> MedicalCenter | None:
        """Get a medical center by its id.

        Args:
            id: The id of the medical center to get

        Returns:
            MedicalCenter with matching id or None if not found.
        """
        raise NotImplementedError

    async def get_nearby_medical_center(
        self, location: Location, complexityLevel: ComplexityLevel
    ) -> list[MedicalCenter]:
        """Get all medical centers that can handle an emergency of a
        given complexity level near a specified location

        Args:
            location: The location to get nearby medical centers from.
            complexityLevel: The minimum complexity level that the
                returned medical centers are expected to have.
        Returns:
            A list of MedicalCenter objects with at least the given
            complexity level, sorted by ascending distance to the
            specified location.
        """
        raise NotImplementedError

    async def get_all_medical_centers(self) -> list[MedicalCenter]:
        """Get all available medical centers registered.


        Returns:
            A list of all medical centers known by the port.
        """
        raise NotImplementedError
