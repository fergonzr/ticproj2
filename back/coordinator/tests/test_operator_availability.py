"""Tests for operator availability functionality."""

import os
import uuid
from datetime import datetime

# We need to set the key before we import the sie_auth library
os.environ["JWT_SECRET_KEY"] = (
    "8640e1758616b2a4be09fa95a0db8c3b34a3473925349c9ce86d36f296510ec3"
)

import pytest
import serde
from core.domain.entities import Emergency
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from fastapi.testclient import TestClient
from sie_auth import create_access_token

from coordinator.main import WebSocketCoordinatorAdapter, app, coordination_adapter
from coordinator.mock_service_discovery import MockServiceDiscoveryAdapter
from coordinator.models import (
    MessageCommand,
    MessageEvent,
    OperatorAvailabilityStatus,
    ReportEmergencyCommand,
    SetOperatorAvailabilityCommand,
)
from coordinator.operator_connection_pool import OperatorConnectionPool


@pytest.fixture
def operator_connection_pool():
    """Create a fresh OperatorConnectionPool for testing."""
    return OperatorConnectionPool()


@pytest.fixture
def test_client_with_operators():
    """Create a test client with multiple operator connections."""
    mock_discovery = MockServiceDiscoveryAdapter()
    test_websocket_adapter = WebSocketCoordinatorAdapter(mock_discovery)
    app.dependency_overrides[coordination_adapter] = lambda: test_websocket_adapter
    app.state.mock_discovery = mock_discovery
    return TestClient(app)


@pytest.fixture
def operator_token():
    """Create a token for Carlos (operator)."""
    return create_access_token({"sub": "carlos@example.com"})


@pytest.fixture
def alert():
    """Create a sample alert for testing."""
    return Alert(
        location=Location(latitude=4.56, longitude=78.3),
        generatedOn=datetime.now(),
        medicalInfo=None,
    )


def test_operator_availability_commands(test_client_with_operators, operator_token):
    """Test that operators can set their availability status."""
    with test_client_with_operators.websocket_connect(
        "/api/v1/coordination/operator", params={"token": operator_token}
    ) as operator_session:
        # Operator should be available initially
        coordinator_adapter = app.dependency_overrides[coordination_adapter]()
        assert (
            coordinator_adapter._operatorConnectionPool.get_available_operator_count()
            == 1
        )

        # Operator marks themselves as unavailable
        availability_command = SetOperatorAvailabilityCommand(
            payload={"status": OperatorAvailabilityStatus.UNAVAILABLE}
        )
        operator_session.send_text(availability_command.model_dump_json())

        # Wait for the command to be processed
        import time

        time.sleep(0.1)

        # Verify the state changed
        assert (
            coordinator_adapter._operatorConnectionPool.get_available_operator_count()
            == 0
        )

        # Operator marks themselves as available again
        availability_command = SetOperatorAvailabilityCommand(
            payload={"status": OperatorAvailabilityStatus.AVAILABLE}
        )
        operator_session.send_text(availability_command.model_dump_json())

        # Wait for the command to be processed
        import time

        time.sleep(0.1)

        # Verify the state changed back
        assert (
            coordinator_adapter._operatorConnectionPool.get_available_operator_count()
            == 1
        )


def test_operator_connection_pool_directly(operator_connection_pool):
    """Test the OperatorConnectionPool class directly."""
    # Test empty pool
    assert operator_connection_pool.get_operator_count() == 0
    assert operator_connection_pool.get_available_operator_count() == 0
    assert operator_connection_pool.next_available_operator_connection() is None
    assert operator_connection_pool.has_available_operators() is False

    # Add operators
    op1_id = uuid.uuid4()
    op2_id = uuid.uuid4()
    op3_id = uuid.uuid4()
    mock_ws1 = object()  # Using object() as mock websocket
    mock_ws2 = object()
    mock_ws3 = object()

    operator_connection_pool.add_operator_connection(op1_id, mock_ws1)
    operator_connection_pool.add_operator_connection(op2_id, mock_ws2)
    operator_connection_pool.add_operator_connection(op3_id, mock_ws3)

    assert operator_connection_pool.get_operator_count() == 3
    assert operator_connection_pool.get_available_operator_count() == 3

    # Test round-robin selection
    first = operator_connection_pool.next_available_operator_connection()
    assert first == mock_ws1

    # Test setting availability
    result = operator_connection_pool.set_operator_availability(
        op1_id, OperatorAvailabilityStatus.UNAVAILABLE
    )
    assert result is True
    assert operator_connection_pool.get_available_operator_count() == 2

    # Test selection after availability change
    second = operator_connection_pool.next_available_operator_connection()
    assert second == mock_ws2

    # Test round-robin continues correctly
    third = operator_connection_pool.next_available_operator_connection()
    assert third == mock_ws3

    # Test making all operators unavailable
    operator_connection_pool.set_operator_availability(
        op2_id, OperatorAvailabilityStatus.UNAVAILABLE
    )
    operator_connection_pool.set_operator_availability(
        op3_id, OperatorAvailabilityStatus.UNAVAILABLE
    )
    assert operator_connection_pool.get_available_operator_count() == 0
    assert operator_connection_pool.next_available_operator_connection() is None
    assert operator_connection_pool.has_available_operators() is False

    # Test making operators available again
    operator_connection_pool.set_operator_availability(
        op2_id, OperatorAvailabilityStatus.AVAILABLE
    )
    assert operator_connection_pool.get_available_operator_count() == 1
    assert operator_connection_pool.has_available_operators() is True

    # Test removing operator
    operator_connection_pool.remove_operator_connection(op1_id)
    assert operator_connection_pool.get_operator_count() == 2

    # Test setting availability for non-existent operator
    result = operator_connection_pool.set_operator_availability(
        uuid.uuid4(), OperatorAvailabilityStatus.AVAILABLE
    )
    assert result is False

    # Test comprehensive round-robin with mixed availability
    operator_connection_pool.set_operator_availability(
        op2_id, OperatorAvailabilityStatus.UNAVAILABLE
    )
    operator_connection_pool.set_operator_availability(
        op3_id, OperatorAvailabilityStatus.AVAILABLE
    )

    selected_operators = []
    for _ in range(5):
        op = operator_connection_pool.next_available_operator_connection()
        if op:
            selected_operators.append(op)

    # Should only select from op3 (available)
    assert len(selected_operators) == 5
    for op in selected_operators:
        assert op == mock_ws3
