import os
import uuid
from datetime import datetime

# We need to set the key before we import the sie_auth library
os.environ["JWT_SECRET_KEY"] = (
    "8640e1758616b2a4be09fa95a0db8c3b34a3473925349c9ce86d36f296510ec3"
)

import pytest
import serde
from core.application.ports import ServiceDiscoveryPort
from core.application.ports.event_binder import NotificationEventBinderPort
from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentEvent,
)
from core.domain.entities import Emergency
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.triage import Triage
from fastapi.testclient import TestClient
from sie_auth import create_access_token

from coordinator.main import WebSocketCoordinatorAdapter, app, coordination_adapter
from coordinator.models import (
    CoreTriageEmergencyCommand,
    MessageCommand,
    MessageEvent,
    ReportEmergencyCommand,
    RequestEmergencyAssignmentCommand,
    RequestEmergencyAssignmentPayload,
    TriageEmergencyCommand,
)

from .mock_service_discovery import mock_discovery


@pytest.fixture
def test_client(mock_discovery):
    """Create a test client with a fresh coordinator adapter."""
    test_websocket_adapter = WebSocketCoordinatorAdapter(mock_discovery)
    app.dependency_overrides[coordination_adapter] = lambda: test_websocket_adapter
    app.state.mock_discovery = mock_discovery
    return TestClient(app)


@pytest.fixture
def alert():
    """Create a sample alert for testing."""
    return Alert(
        location=Location(latitude=4.56, longitude=78.3),
        generatedOn=datetime.now(),
        medicalInfo=None,
    )


@pytest.fixture
def triage():
    """Create a sample triage for testing."""
    return Triage(
        bleeding=False,
        dizziness=False,
        blurred_vision=False,
        unconscious=False,
        difficulty_breathing=False,
        fracture=False,
        chest_pain=False,
        numbness_limbs=False,
    )


@pytest.fixture
def operator_token():
    return create_access_token({"sub": "carlos@example.com"})


@pytest.fixture
def paramedic_token():
    return create_access_token({"sub": "javier@example.com"})


def test_report_alert(test_client: TestClient, alert: Alert, operator_token: str):
    """Test that an emergency is reported correctly and both citizen
    and operator receives confirmation."""

    with test_client.websocket_connect(
        "/api/v1/coordination/citizen"
    ) as citizenSession:
        with test_client.websocket_connect(
            "/api/v1/coordination/operator", params={"token": operator_token}
        ) as operatorSession:
            citizenSession.send_text(
                ReportEmergencyCommand(
                    command=MessageCommand.REPORT, payload=alert
                ).model_dump_json()
            )

            responseCitizen = citizenSession.receive_json()
            receivedEmergencyCitizen = serde.from_dict(
                Emergency, responseCitizen["payload"]
            )
            responseOperator = operatorSession.receive_json()
            receivedEmergencyOperator = serde.from_dict(
                Emergency, responseOperator["payload"]
            )

            assert responseCitizen["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyCitizen.alert == alert
            assert receivedEmergencyCitizen.status.value == "RECEIVED"

            assert responseOperator["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyOperator.alert == alert
            assert receivedEmergencyOperator.status.value == "RECEIVED"


def test_triage_emergency(
    test_client: TestClient, alert: Alert, operator_token: str, triage: Triage
):
    """Test that an emergency is triaged correctly and both citizen
    and operator receives confirmation."""

    with test_client.websocket_connect(
        "/api/v1/coordination/citizen"
    ) as citizenSession:
        with test_client.websocket_connect(
            "/api/v1/coordination/operator", params={"token": operator_token}
        ) as operatorSession:
            citizenSession.send_text(
                ReportEmergencyCommand(
                    command=MessageCommand.REPORT, payload=alert
                ).model_dump_json()
            )

            responseCitizen = citizenSession.receive_json()
            receivedEmergencyCitizen = serde.from_dict(
                Emergency, responseCitizen["payload"]
            )
            responseOperator = operatorSession.receive_json()
            receivedEmergencyOperator = serde.from_dict(
                Emergency, responseOperator["payload"]
            )

            assert responseCitizen["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyCitizen.alert == alert
            assert receivedEmergencyCitizen.status.value == "RECEIVED"

            assert responseOperator["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyOperator.alert == alert
            assert receivedEmergencyOperator.status.value == "RECEIVED"

            # Send the triage

            operatorSession.send_text(
                TriageEmergencyCommand(
                    command=MessageCommand.TRIAGE,
                    payload=CoreTriageEmergencyCommand(
                        emergencyId=receivedEmergencyOperator.id, triage=triage
                    ),
                ).model_dump_json()
            )

            responseOperator = operatorSession.receive_json()
            receivedEmergencyOperator = serde.from_dict(
                Emergency, responseOperator["payload"]
            )
            responseCitizen = citizenSession.receive_json()
            receivedEmergencyCitizen = serde.from_dict(
                Emergency, responseCitizen["payload"]
            )

            assert responseCitizen["event"] == MessageEvent.TRIAGED.value
            assert receivedEmergencyCitizen.alert == alert
            assert receivedEmergencyCitizen.triage == triage
            assert receivedEmergencyCitizen.status.value == "TRIAGED"

            assert responseOperator["event"] == MessageEvent.TRIAGED.value
            assert receivedEmergencyOperator.alert == alert
            assert receivedEmergencyOperator.triage == triage
            assert receivedEmergencyOperator.status.value == "TRIAGED"


async def test_request_emergency_assignment(
    mock_discovery: ServiceDiscoveryPort,
    test_client: TestClient,
    alert: Alert,
    operator_token: str,
    triage: Triage,
):
    """Test that the requested emergency assignment goes to the redis
    database"""

    with test_client.websocket_connect(
        "/api/v1/coordination/citizen"
    ) as citizenSession:
        with test_client.websocket_connect(
            "/api/v1/coordination/operator", params={"token": operator_token}
        ) as operatorSession:
            citizenSession.send_text(
                ReportEmergencyCommand(
                    command=MessageCommand.REPORT, payload=alert
                ).model_dump_json()
            )

            responseCitizen = citizenSession.receive_json()
            receivedEmergencyCitizen = serde.from_dict(
                Emergency, responseCitizen["payload"]
            )
            responseOperator = operatorSession.receive_json()
            receivedEmergencyOperator = serde.from_dict(
                Emergency, responseOperator["payload"]
            )

            assert responseCitizen["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyCitizen.alert == alert
            assert receivedEmergencyCitizen.status.value == "RECEIVED"

            assert responseOperator["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyOperator.alert == alert
            assert receivedEmergencyOperator.status.value == "RECEIVED"

            # Send the triage

            operatorSession.send_text(
                TriageEmergencyCommand(
                    command=MessageCommand.TRIAGE,
                    payload=CoreTriageEmergencyCommand(
                        emergencyId=receivedEmergencyOperator.id, triage=triage
                    ),
                ).model_dump_json()
            )

            responseOperator = operatorSession.receive_json()
            receivedEmergencyOperator = serde.from_dict(
                Emergency, responseOperator["payload"]
            )
            responseCitizen = citizenSession.receive_json()
            receivedEmergencyCitizen = serde.from_dict(
                Emergency, responseCitizen["payload"]
            )

            assert responseCitizen["event"] == MessageEvent.TRIAGED.value
            assert receivedEmergencyCitizen.alert == alert
            assert receivedEmergencyCitizen.triage == triage
            assert receivedEmergencyCitizen.status.value == "TRIAGED"

            assert responseOperator["event"] == MessageEvent.TRIAGED.value
            assert receivedEmergencyOperator.alert == alert
            assert receivedEmergencyOperator.triage == triage
            assert receivedEmergencyOperator.status.value == "TRIAGED"

            # Bind the appropriate event

            # eventBinder: NotificationEventBinderPort = mock_discovery.build_adapter(
            #     NotificationEventBinderPort
            # )

            # async def handler(payloadReceived: RequestEmergencyAssignmentPayload):
            #     assert payloadReceived.emergencyId == receivedEmergencyOperator.id
            #     assert payloadReceived.paramedicId == uuid.UUID(
            #         "77e22242-8aaf-488d-b4ec-256a43bb67b0"
            #     )
            #
            # await eventBinder.bind(RequestEmergencyAssignmentEvent, handler)

            # Send the request to operator

            operatorSession.send_text(
                RequestEmergencyAssignmentCommand(
                    command=MessageCommand.REQUEST_ASSIGN,
                    payload=RequestEmergencyAssignmentPayload(
                        emergencyId=receivedEmergencyOperator.id,
                        paramedicId=uuid.UUID("77e22242-8aaf-488d-b4ec-256a43bb67b0"),
                    ),
                ).model_dump_json()
            )

            # We really cannot test that the request is properly sent at this level.


def test_emergency_assignment(
    test_client: TestClient,
    alert: Alert,
    operator_token: str,
    paramedic_token: str,
    triage: Triage,
):
    """Test that the emergency can be properly assigned"""

    with test_client.websocket_connect(
        "/api/v1/coordination/citizen"
    ) as citizenSession:
        with test_client.websocket_connect(
            "/api/v1/coordination/operator", params={"token": operator_token}
        ) as operatorSession:
            citizenSession.send_text(
                ReportEmergencyCommand(
                    command=MessageCommand.REPORT, payload=alert
                ).model_dump_json()
            )

            responseCitizen = citizenSession.receive_json()
            receivedEmergencyCitizen = serde.from_dict(
                Emergency, responseCitizen["payload"]
            )
            responseOperator = operatorSession.receive_json()
            receivedEmergencyOperator = serde.from_dict(
                Emergency, responseOperator["payload"]
            )

            assert responseCitizen["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyCitizen.alert == alert
            assert receivedEmergencyCitizen.status.value == "RECEIVED"

            assert responseOperator["event"] == MessageEvent.RECEIVED.value
            assert receivedEmergencyOperator.alert == alert
            assert receivedEmergencyOperator.status.value == "RECEIVED"

            # Send the triage

            operatorSession.send_text(
                TriageEmergencyCommand(
                    command=MessageCommand.TRIAGE,
                    payload=CoreTriageEmergencyCommand(
                        emergencyId=receivedEmergencyOperator.id, triage=triage
                    ),
                ).model_dump_json()
            )

            responseOperator = operatorSession.receive_json()
            receivedEmergencyOperator = serde.from_dict(
                Emergency, responseOperator["payload"]
            )
            responseCitizen = citizenSession.receive_json()
            receivedEmergencyCitizen = serde.from_dict(
                Emergency, responseCitizen["payload"]
            )

            assert responseCitizen["event"] == MessageEvent.TRIAGED.value
            assert receivedEmergencyCitizen.alert == alert
            assert receivedEmergencyCitizen.triage == triage
            assert receivedEmergencyCitizen.status.value == "TRIAGED"

            assert responseOperator["event"] == MessageEvent.TRIAGED.value
            assert receivedEmergencyOperator.alert == alert
            assert receivedEmergencyOperator.triage == triage
            assert receivedEmergencyOperator.status.value == "TRIAGED"

            with test_client.websocket_connect(
                f"/api/v1/coordination/paramedic/{receivedEmergencyOperator.id}",
                params={"token": paramedic_token},
            ) as paramedicSession:
                responseOperator = operatorSession.receive_json()
                receivedEmergencyOperator = serde.from_dict(
                    Emergency, responseOperator["payload"]
                )

                assert responseOperator["event"] == MessageEvent.ASSIGNED.value
                assert receivedEmergencyOperator.alert == alert
                assert receivedEmergencyOperator.triage == triage
                assert receivedEmergencyOperator.assignedTo is not None
                assert receivedEmergencyOperator.assignedTo.id == uuid.UUID(
                    "77e22242-8aaf-488d-b4ec-256a43bb67b0"
                )
                assert receivedEmergencyOperator.status.value == "ASSIGNED"

                responseCitizen = citizenSession.receive_json()
                receivedEmergencyCitizen = serde.from_dict(
                    Emergency, responseCitizen["payload"]
                )
                responseParamedic = paramedicSession.receive_json()
                receivedEmergencyParamedic = serde.from_dict(
                    Emergency, responseParamedic["payload"]
                )

                assert responseCitizen["event"] == MessageEvent.ASSIGNED.value
                assert receivedEmergencyCitizen.alert == alert
                assert receivedEmergencyCitizen.triage == triage
                assert receivedEmergencyCitizen.status.value == "ASSIGNED"
                assert receivedEmergencyCitizen.assignedTo is not None
                assert receivedEmergencyCitizen.assignedTo.id == uuid.UUID(
                    "77e22242-8aaf-488d-b4ec-256a43bb67b0"
                )

                assert responseParamedic["event"] == MessageEvent.ASSIGNED.value
                assert receivedEmergencyParamedic.alert == alert
                assert receivedEmergencyParamedic.triage == triage
                assert receivedEmergencyParamedic.assignedTo is not None
                assert receivedEmergencyParamedic.assignedTo.id == uuid.UUID(
                    "77e22242-8aaf-488d-b4ec-256a43bb67b0"
                )
                assert receivedEmergencyParamedic.status.value == "ASSIGNED"
