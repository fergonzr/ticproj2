import enum

from core.domain.value_objects.location import Location
from pydantic import BaseModel


class MessageCommand(enum.Enum):
    UPDATE_LOCATION = "UPDATE_LOCATION"


class Message(BaseModel):
    command: MessageCommand
    payload: dict


class UpdateLocationPayload(BaseModel):
    latitude: float
    longitude: float

    def to_location(self):
        return Location(latitude=self.latitude, longitude=self.longitude)
