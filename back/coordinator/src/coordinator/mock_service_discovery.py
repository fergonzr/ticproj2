"""A wrapper around the DockerDiscoveryService to allow process communication outside of docker."""

import pytest
from core.application.ports import Port, Service
from core.application.ports.user_manager import UserManagerPort
from cqrs.message_brokers.protocol import MessageBroker
from docker_discovery import DockerServiceDiscoveryAdapter
from docker_discovery.mock_adapters import MockYamlUserManagerAdapter


class MockServiceDiscoveryAdapter(DockerServiceDiscoveryAdapter):
    def __init__(self) -> None:
        super().__init__("../docker-compose.yaml")

    def get_service(self, service_name: str) -> Service:
        service = super().get_service(service_name)
        service.host = "localhost"
        return service

    def build_adapter(self, port_type: type[Port]) -> Port:
        if port_type is UserManagerPort:
            return MockYamlUserManagerAdapter("../users.yaml")
        return super().build_adapter(port_type)


@pytest.fixture
def mock_discovery():
    return MockServiceDiscoveryAdapter()
