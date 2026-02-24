"""Location value object module.

This module defines the Location value object, which represents geographical
coordinates for emergencies and other location-based operations.
"""

from pydantic import BaseModel


class Location(BaseModel):
    """Represents geographical coordinates.

    This value object encapsulates latitude and longitude coordinates to
    represent a specific location on the Earth's surface.

    Attributes:
        latitude: The latitude coordinate in decimal degrees.
        longitude: The longitude coordinate in decimal degrees.
    """

    latitude: float
    longitude: float
