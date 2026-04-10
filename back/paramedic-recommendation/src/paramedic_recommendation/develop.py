"""A wrapper around the DockerDiscoveryService to allow process communication outside of docker."""

from core.application.factories import create_mediator
from core.application.ports import Port, Service
from core.application.ports.user_manager import UserManagerPort
from core.application.use_cases.get_nearby_paramedics_for_emergency import (
    GetNearbyParamedicsForEmergencyQuery,
)
from core.application.use_cases.get_user_by_email import GetUserByEmailQuery
from core.domain.entities.user import UserRole
from cqrs.message_brokers.protocol import MessageBroker
from docker_discovery import DockerServiceDiscoveryAdapter
from docker_discovery.mock_adapters import MockYamlUserManagerAdapter
from sie_auth import generate_get_current_user_dep

from .main import app, get_discovery_adapter, get_operator_user


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


mockDiscoveryAdapter = MockServiceDiscoveryAdapter()
mockMediator = create_mediator(
    mockDiscoveryAdapter,
    useCases=[GetUserByEmailQuery, GetNearbyParamedicsForEmergencyQuery],
)
app.dependency_overrides[get_discovery_adapter] = lambda: mockDiscoveryAdapter

devGetOperatorUser = generate_get_current_user_dep(
    mockMediator, roles={UserRole.OPERATOR}
)
app.dependency_overrides[get_operator_user] = devGetOperatorUser
