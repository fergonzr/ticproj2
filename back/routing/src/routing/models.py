"""DTOs for the routing service."""

from pydantic import BaseModel, field_serializer

from core.domain.value_objects.location import Location


class LocationInput(BaseModel):
    """Pydantic-compatible wrapper for Location input."""
    latitude: float
    longitude: float

    def to_domain(self) -> Location:
        return Location(latitude=self.latitude, longitude=self.longitude)


class RouteRequest(BaseModel):
    """DTO returned by GET /api/v1/routing.

    Attributes:
        from_location: Origin location.
        to_location:   Destination location.
        distance_m:    Total route distance in meters.
        time_ms:       Estimated travel time in milliseconds.
    """
    model_config = {"arbitrary_types_allowed": True}

    from_location: Location
    to_location: Location
    distance_m: float
    time_ms: int

    @field_serializer("from_location", "to_location")
    def serialize_location(self, loc: Location) -> dict:
        return {"latitude": loc.latitude, "longitude": loc.longitude}