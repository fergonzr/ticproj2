from .main import WebSocketCoordinatorAdapter, app, coordination_adapter
from .mock_service_discovery import MockServiceDiscoveryAdapter

testCoordinatorAdapter = WebSocketCoordinatorAdapter(MockServiceDiscoveryAdapter())

app.dependency_overrides[coordination_adapter] = lambda: testCoordinatorAdapter
