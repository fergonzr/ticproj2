import pytest
from core.application.ports.port import Service
from core.application.ports.realtime_storage import RealTimeStoragePort
from port_integration_tests.realtime_storage import *

from dragonfly_rtstorage.main import DragonflyRealTimeStorageAdapter


@pytest.fixture
def adapter() -> RealTimeStoragePort:
    # TODO: Parametrize the service variables. Currently this assumes
    # the test executor is the host itself, NOT A CONTAINER.
    return DragonflyRealTimeStorageAdapter(Service("localhost", 6379))


@pytest.fixture(autouse=True)
def cleanup_redis():
    """Clean up Redis database between tests for proper isolation."""
    # This fixture runs automatically before and after each test
    adapter = DragonflyRealTimeStorageAdapter(Service("localhost", 6379))

    # Clean up before test
    yield

    # Clean up after test - use sync wrapper for async cleanup
    import asyncio

    async def _async_cleanup():
        # Delete all paramedic keys
        paramedic_keys = await adapter._redis_client.keys("paramedic:*")
        for key in paramedic_keys:
            await adapter._redis_client.delete(key)

        await adapter._redis_client.delete("paramedics:locations")

        # Clean up emergency data
        emergency_keys = await adapter._redis_client.keys("*")
        for key in emergency_keys:
            if key.startswith("emergency:") or (
                ":" not in key and key != "paramedics:locations"
            ):
                await adapter._redis_client.delete(key)

    asyncio.run(_async_cleanup())
