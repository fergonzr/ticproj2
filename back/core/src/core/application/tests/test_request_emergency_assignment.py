"""Tests for the RequestEmergencyAssignment use case.

This module contains unit tests for the RequestEmergencyAssignment use case,
which handles requesting that a paramedic be assigned to an emergency.
"""

import uuid
from datetime import datetime

import pytest

from core.application.use_cases.request_emergency_assignment import (
    RequestEmergencyAssignmentCommand,
    RequestEmergencyAssignmentHandler,
)
from core.domain.entities.emergency import (
    Emergency,
    EmergencyNotFoundError,
    EmergencyStatus,
)
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.medical_info import MedicalInfo


@pytest.fixture
def mock_realtime_storage():
    """Fixture that provides a mock realtime storage for testing."""
    from core.application.tests.mock_adapters import MockRealTimeStoragePort

    return MockRealTimeStoragePort()


@pytest.fixture
def request_emergency_assignment_handler(
    mock_realtime_storage,
) -> RequestEmergencyAssignmentHandler:
    """Fixture that provides a handler configured with mock adapters
    for testing the RequestEmergencyAssignment use case."""
    return RequestEmergencyAssignmentHandler(storage=mock_realtime_storage)


@pytest.fixture
def sample_emergency() -> Emergency:
    """Fixture that provides a sample emergency for testing."""
    alert = Alert(
        location=Location(latitude=12.34, longitude=56.78),
        generatedOn=datetime(2023, 1, 1, 12, 0, 0),
        medicalInfo=MedicalInfo(),
    )
    return Emergency.from_alert(alert)


class TestRequestEmergencyAssignmentUseCase:
    """Test cases for the RequestEmergencyAssignment use case."""

    @pytest.mark.asyncio
    async def test_request_emergency_assignment_fires_event(
        self,
        request_emergency_assignment_handler,
        sample_emergency,
        mock_realtime_storage,
    ):
        """Test that the use case fires an event for the assignment request."""
        # Arrange
        paramedic_id = uuid.uuid4()
        confirmation_url = "http://example.com/confirm"

        # Save the emergency first so it can be found
        await mock_realtime_storage.save_emergency(sample_emergency)

        command = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id,
            emergencyId=sample_emergency.timeline[EmergencyStatus.RECEIVED],
            confirmationURL=confirmation_url,
        )

        # Act
        await request_emergency_assignment_handler.handle(command)

        # Assert
        # Verify that one event was fired
        events = request_emergency_assignment_handler.events
        assert len(events) == 1

        # Verify the event contains the correct data
        event = events[0]
        assert event.event_name == "request_emergency_assignment"
        assert event.topic == "emergency_assignment"
        assert event.payload.paramedicId == paramedic_id
        assert event.payload.emergencyId == sample_emergency.id
        assert event.payload.confirmationURL == confirmation_url

    @pytest.mark.asyncio
    async def test_request_emergency_assignment_fails_when_emergency_not_found(
        self, request_emergency_assignment_handler
    ):
        """Test that the use case raises EmergencyNotFoundError when emergency doesn't exist."""
        # Arrange
        paramedic_id = uuid.uuid4()
        non_existent_emergency_id = datetime(2023, 1, 1, 12, 0, 0)
        confirmation_url = "http://example.com/confirm"

        command = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id,
            emergencyId=non_existent_emergency_id,
            confirmationURL=confirmation_url,
        )

        # Act & Assert
        with pytest.raises(EmergencyNotFoundError):
            await request_emergency_assignment_handler.handle(command)

        # Verify no event was fired
        events = request_emergency_assignment_handler.events
        assert len(events) == 0

    @pytest.mark.asyncio
    async def test_request_emergency_assignment_with_different_paramedics(
        self,
        request_emergency_assignment_handler,
        sample_emergency,
        mock_realtime_storage,
    ):
        """Test that the use case can fire events for different paramedics."""
        # Arrange
        paramedic_id1 = uuid.uuid4()
        paramedic_id2 = uuid.uuid4()
        confirmation_url = "http://example.com/confirm"

        # Save the emergency first
        await mock_realtime_storage.save_emergency(sample_emergency)

        command1 = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id1,
            emergencyId=sample_emergency.timeline[EmergencyStatus.RECEIVED],
            confirmationURL=confirmation_url,
        )

        command2 = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id2,
            emergencyId=sample_emergency.timeline[EmergencyStatus.RECEIVED],
            confirmationURL=confirmation_url,
        )

        # Act
        await request_emergency_assignment_handler.handle(command1)
        await request_emergency_assignment_handler.handle(command2)

        # Assert
        # Verify two events were fired
        events = request_emergency_assignment_handler.events
        assert len(events) == 2

        # Verify each event was for a different paramedic
        assert events[0].payload.paramedicId == paramedic_id1
        assert events[1].payload.paramedicId == paramedic_id2

        # Verify both events were for the same emergency
        assert events[0].payload.emergencyId == sample_emergency.id
        assert events[1].payload.emergencyId == sample_emergency.id

    @pytest.mark.asyncio
    async def test_request_emergency_assignment_with_different_emergencies(
        self,
        request_emergency_assignment_handler,
        mock_realtime_storage,
    ):
        """Test that the use case can fire events for different emergencies."""
        # Arrange
        paramedic_id = uuid.uuid4()
        confirmation_url = "http://example.com/confirm"

        # Create two different emergencies
        alert1 = Alert(
            location=Location(latitude=1.0, longitude=2.0),
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=MedicalInfo(),
        )
        emergency1 = Emergency.from_alert(alert1)

        alert2 = Alert(
            location=Location(latitude=3.0, longitude=4.0),
            generatedOn=datetime(2023, 1, 2, 12, 0, 0),
            medicalInfo=MedicalInfo(),
        )
        emergency2 = Emergency.from_alert(alert2)

        # Save both emergencies
        await mock_realtime_storage.save_emergency(emergency1)
        await mock_realtime_storage.save_emergency(emergency2)

        command1 = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id,
            emergencyId=emergency1.timeline[EmergencyStatus.RECEIVED],
            confirmationURL=confirmation_url,
        )

        command2 = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id,
            emergencyId=emergency2.timeline[EmergencyStatus.RECEIVED],
            confirmationURL=confirmation_url,
        )

        # Act
        await request_emergency_assignment_handler.handle(command1)
        await request_emergency_assignment_handler.handle(command2)

        # Assert
        # Verify two events were fired
        events = request_emergency_assignment_handler.events
        assert len(events) == 2

        # Verify each event was for a different emergency
        assert events[0].payload.emergencyId == emergency1.id
        assert events[1].payload.emergencyId == emergency2.id

        # Verify both events were for the same paramedic
        assert events[0].payload.paramedicId == paramedic_id
        assert events[1].payload.paramedicId == paramedic_id

    @pytest.mark.asyncio
    async def test_request_emergency_assignment_with_different_confirmation_urls(
        self,
        request_emergency_assignment_handler,
        sample_emergency,
        mock_realtime_storage,
    ):
        """Test that the use case can use different confirmation URLs in events."""
        # Arrange
        paramedic_id = uuid.uuid4()

        # Save the emergency first
        await mock_realtime_storage.save_emergency(sample_emergency)

        command1 = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id,
            emergencyId=sample_emergency.timeline[EmergencyStatus.RECEIVED],
            confirmationURL="http://example.com/confirm1",
        )

        command2 = RequestEmergencyAssignmentCommand(
            paramedicId=paramedic_id,
            emergencyId=sample_emergency.timeline[EmergencyStatus.RECEIVED],
            confirmationURL="http://example.com/confirm2",
        )

        # Act
        await request_emergency_assignment_handler.handle(command1)
        await request_emergency_assignment_handler.handle(command2)

        # Assert
        # Verify two events were fired
        events = request_emergency_assignment_handler.events
        assert len(events) == 2

        # Verify each event has the correct confirmation URL
        assert events[0].payload.confirmationURL == "http://example.com/confirm1"
        assert events[1].payload.confirmationURL == "http://example.com/confirm2"
