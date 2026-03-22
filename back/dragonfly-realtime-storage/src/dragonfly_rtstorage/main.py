import dataclasses
import json
import math
from datetime import datetime
from typing import AsyncGenerator
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
        # Use timestamp as key
        key = "emergency:" + str(emergency.timeline[EmergencyStatus.RECEIVED])
        await self._redis_client.set(key, data)

    async def get_emergency(self, createdOn: datetime) -> Emergency | None:
        # Use timestamp as key
        key = "emergency:" + str(createdOn)
        data = await self._redis_client.get(key)

        return from_json(Emergency, data) if data else None

    async def get_paramedic(self, paramedicId: UUID) -> Paramedic | None:
        """Get a paramedic by ID from Redis.

        Args:
            paramedicId: The unique identifier of the paramedic.

        Returns:
            Paramedic object if found, None otherwise.
        """
        data = await self._redis_client.get(f"paramedic:{paramedicId}")
        return from_json(Paramedic, data) if data else None

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

    async def get_nearby_paramedics(
        self, location: Location
    ) -> AsyncGenerator[Paramedic, None]:
        """Get paramedics near a specific location.

        Args:
            location: The target location to find nearby paramedics.

        Yields:
            Paramedic objects that are near the specified location.
        """
        # Use Redis GEORADIUS to find nearby paramedics (within 100km)
        nearby_paramedic_ids = await self._redis_client.georadius(
            "paramedics:locations",
            location.longitude,
            location.latitude,
            100,  # 100km radius
            unit="km",
        )

        for paramedic_id in nearby_paramedic_ids:
            paramedic = await self.get_paramedic(UUID(paramedic_id))
            if paramedic is not None:
                yield paramedic
