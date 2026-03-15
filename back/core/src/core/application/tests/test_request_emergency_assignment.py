"""Tests for the RequestEmergencyAssignment use case.

This module contains unit tests for the RequestEmergencyAssignment use case,
which handles requesting that a paramedic be assigned to an emergency.
"""

import uuid
from datetime import datetime

import pytest

from core.application.tests.mock_adapters import (
    mock_location_updater,
    mock_realtime_storage,
)
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
def request_emergency_assignment_handler(
    mock_realtime_storage, mock_location_updater
) -> RequestEmergencyAssignmentHandler:
    """Fixture that provides a handler configured with mock adapters
    for testing the RequestEmergencyAssignment use case."""
    return RequestEmergencyAssignmentHandler(
        storage=mock_realtime_storage, locationUpdater=mock_location_updater
    )


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
    @pytest.mark.asyncio
    async def test_request_emergency_assignment_requests_assignment_from_location_updater(
        self,
        request_emergency_assignment_handler,
        sample_emergency,
        mock_location_updater,
        mock_realtime_storage,
    ):
        """Test that the use case requests assignment from the location updater."""
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
        # Verify that request_emergency_assignment was called
        requests = mock_location_updater.get_request_calls()
        assert len(requests) == 1

        # Verify the request contains the correct data
        request = requests[0]
        assert request[0] == paramedic_id
        assert request[1].id == sample_emergency.id
        assert request[2] == confirmation_url

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_request_emergency_assignment_fails_when_emergency_not_found(
        self, request_emergency_assignment_handler, mock_location_updater
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

        # Verify no request was made to location updater
        requests = mock_location_updater.get_request_calls()
        assert len(requests) == 0

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_request_emergency_assignment_with_different_paramedics(
        self,
        request_emergency_assignment_handler,
        sample_emergency,
        mock_location_updater,
        mock_realtime_storage,
    ):
        """Test that the use case can request assignments for different paramedics."""
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
        # Verify two requests were made
        requests = mock_location_updater.get_request_calls()
        assert len(requests) == 2

        # Verify each request was for a different paramedic
        assert requests[0][0] == paramedic_id1
        assert requests[1][0] == paramedic_id2

        # Verify both requests were for the same emergency
        assert requests[0][1].id == sample_emergency.id
        assert requests[1][1].id == sample_emergency.id

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_request_emergency_assignment_with_different_emergencies(
        self,
        request_emergency_assignment_handler,
        mock_location_updater,
        mock_realtime_storage,
    ):
        """Test that the use case can request assignments for different emergencies."""
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
        # Verify two requests were made
        requests = mock_location_updater.get_request_calls()
        assert len(requests) == 2

        # Verify each request was for a different emergency
        assert requests[0][1].id == emergency1.id
        assert requests[1][1].id == emergency2.id

        # Verify both requests were for the same paramedic
        assert requests[0][0] == paramedic_id
        assert requests[1][0] == paramedic_id

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_request_emergency_assignment_with_different_confirmation_urls(
        self,
        request_emergency_assignment_handler,
        sample_emergency,
        mock_location_updater,
        mock_realtime_storage,
    ):
        """Test that the use case can use different confirmation URLs."""
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
        # Verify two requests were made
        requests = mock_location_updater.get_request_calls()
        assert len(requests) == 2

        # Verify each request has the correct confirmation URL
        assert requests[0][2] == "http://example.com/confirm1"
        assert requests[1][2] == "http://example.com/confirm2"
