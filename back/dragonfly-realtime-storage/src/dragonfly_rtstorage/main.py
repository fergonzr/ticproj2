import dataclasses
import json
from datetime import datetime

import redis.asyncio as aioredis
from core.application.ports import Service
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import Emergency, EmergencyStatus
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
        key = str(emergency.timeline[EmergencyStatus.RECEIVED])
        await self._redis_client.set(key, data)

    async def get_emergency(self, createdOn: datetime) -> Emergency | None:
        # Use timestamp as key
        data = await self._redis_client.get(str(createdOn))

        return from_json(Emergency, data)
