import json
import logging
import uuid
from typing import List
from uuid import UUID

import redis.asyncio as aioredis
from core.application.ports import Service
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.entities.user import Paramedic
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource
from serde.json import from_json, to_json


class DragonflyRealTimeStorageAdapter(RealTimeStoragePort):
    _dragonflyService: Service
    _redis_client: aioredis.Redis
    requiredServices = ["dragonflyDb"]

    def __init__(self, dragonflyDb: Service):
        self._dragonflyService = dragonflyDb
        self._redis_client = aioredis.Redis(
            host=self._dragonflyService.host,
            port=self._dragonflyService.port,
            decode_responses=True,
        )

    async def save_emergency(self, emergency: Emergency):
        """Save emergency data to Redis.

        Args:
            emergency: The Emergency entity containing the data to be saved.
        """
        data = to_json(emergency)
        # Use emergency ID as key
        key = "emergency:" + str(emergency.id)
        await self._redis_client.set(key, data)

    async def delete_emergency(self, emergencyId: uuid.UUID) -> Emergency | None:
        emergency = await self.get_emergency(emergencyId)
        if emergency is None:
            return None

        await self._redis_client.delete("emergency:" + str(emergency.id))
        return emergency

    async def get_emergency(self, emergencyId: UUID) -> Emergency | None:
        # Use emergency ID as key
        key = "emergency:" + str(emergencyId)
        data = await self._redis_client.get(key)

        return from_json(Emergency, data) if data else None

    async def get_paramedic(self, paramedicId: UUID) -> Paramedic | None:
        """Get a paramedic by ID from Redis.

        Args:
            paramedicId: The unique identifier of the paramedic.

        Returns:
            Paramedic object if found, None otherwise.
        """
        data = await self._redis_client.get(str(f"paramedic:{paramedicId}"))
        result = from_json(Paramedic, data) if data else None
        return result

    async def save_paramedic(self, paramedic: Paramedic):
        """Save or update a paramedic in Redis.

        Args:
            paramedic: The Paramedic entity to save or update.
        """
        data = to_json(paramedic)
        key = f"paramedic:{paramedic.id}"
        await self._redis_client.set(key, data)

        # Also add to geospatial index for location-based queries
        if paramedic.resource and paramedic.resource.location:
            location = paramedic.resource.location
            await self._redis_client.geoadd(
                "paramedics:locations",
                (location.longitude, location.latitude, str(paramedic.id)),
            )

    async def delete_paramedic(self, paramedicId: UUID) -> Paramedic | None:
        """Delete a paramedic from Redis.

        Args:
            paramedicId: The unique identifier of the paramedic to delete.

        Returns:
            The deleted Paramedic object if found, None otherwise.
        """
        # Get the paramedic before deletion
        paramedic = await self.get_paramedic(paramedicId)
        if paramedic is None:
            return None

        # Delete from main storage
        await self._redis_client.delete(f"paramedic:{paramedicId}")

        # Remove from geospatial index
        await self._redis_client.zrem("paramedics:locations", str(paramedicId))

        return paramedic

    async def get_nearby_paramedics(self, location: Location) -> list[Paramedic]:
        """Get paramedics near a specific location.

        Args:
            location: The target location to find nearby paramedics.

        Returns:
            list of Paramedic objects closest to the target location
        """
        # Use Redis GEORADIUS to find nearby paramedics (within 100km)
        nearby_paramedic_ids = await self._redis_client.geosearch(
            "paramedics:locations",
            longitude=location.longitude,
            latitude=location.latitude,
            radius=100,  # 100km radius
            unit="km",
            sort="ASC",
        )

        nearby_paramedics = []
        for paramedic_id in nearby_paramedic_ids:
            paramedic = await self.get_paramedic(UUID(paramedic_id))
            if paramedic is not None:
                nearby_paramedics.append(paramedic)

        return nearby_paramedics

    async def save_operated_emergencies(
        self, operatorId: uuid.UUID, emergencyIds: list[uuid.UUID]
    ):
        """Save the ids of the emergencies currently operated by an operator."""

        await self._redis_client.set(
            f"operators:{str(operatorId)}", to_json(emergencyIds)
        )

    async def get_operated_emergencies(self, operatorId: uuid.UUID) -> list[Emergency]:
        data = await self._redis_client.get(f"operators:{operatorId}")

        if data is None:
            return []

        emergencies = []
        emergencyIds = from_json(List[uuid.UUID], data)
        for id in emergencyIds:
            emergencies.append(await self.get_emergency(id))

        return emergencies
