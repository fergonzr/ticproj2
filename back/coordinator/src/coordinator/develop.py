import uvicorn

from .main import WebSocketCoordinatorAdapter, app, coordination_adapter
from .mock_service_discovery import MockServiceDiscoveryAdapter

testCoordinatorAdapter = WebSocketCoordinatorAdapter(MockServiceDiscoveryAdapter())

app.dependency_overrides[coordination_adapter] = lambda: testCoordinatorAdapter


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
