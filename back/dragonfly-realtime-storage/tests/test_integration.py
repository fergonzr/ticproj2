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
