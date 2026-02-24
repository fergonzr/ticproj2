import json

import redis.asyncio as aioredis
from core.application.ports import Service
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.emergency import Emergency


class DragonflyRealTimeStorageAdapter(RealTimeStoragePort):
    _dragonflyService: Service
    _redis_client: aioredis.Redis
    requiredServices = ["dragonflyDb"]

    def __init__(self, dragonflyDb: Service):
        self._dragonflyService = dragonflyDb
        self._redis_client = aioredis.Redis(
            host=self._dragonflyService["host"],
            port=self._dragonflyService["port"],
            decode_responses=True,
        )

    async def save_emergency(self, emergency: Emergency):
        """Save emergency data to Redis.

        Args:
            emergency: The Emergency entity containing the data to be saved.
        """
        data = emergency.to_dict()
        # Use timestamp as key
        key = str(emergency.createdOn)
        await self._redis_client.set(key, json.dumps(data))
