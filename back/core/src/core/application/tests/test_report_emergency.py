"""Tests for the ReportEmergency use case.

This module contains unit tests for the ReportEmergency use case,
which handles the reporting of new emergencies to the system.
"""

import uuid
from datetime import datetime

import pytest
import pytest_asyncio

from core.application.tests.mock_adapters import (
    mock_coordinator_port,
    mock_realtime_storage,
)
from core.application.use_cases.report_emergency import (
    ReportEmergencyCommand,
    ReportEmergencyHandler,
)
from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.medical_info import MedicalInfo


@pytest.fixture
def report_emergency_handler(
    mock_realtime_storage, mock_coordinator_port
) -> ReportEmergencyHandler:
    """Fixture that provides a handler configured with mock adapters
    for testing the ReportEmergency use case."""

    # Create the handler with the mock adapters
    return ReportEmergencyHandler(
        storage=mock_realtime_storage, coordinator=mock_coordinator_port
    )


@pytest.fixture
def sample_alert() -> Alert:
    """Fixture that provides a sample alert for testing."""
    return Alert(
        location=Location(latitude=12.34, longitude=56.78),
        generatedOn=datetime(2023, 1, 1, 12, 0, 0),
        medicalInfo=MedicalInfo(),
    )


class TestReportEmergencyUseCase:
    """Test cases for the ReportEmergency use case."""

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_report_emergency_saves_emergency_to_storage(
        self, report_emergency_handler, sample_alert, mock_realtime_storage
    ):
        """Test that the use case saves the emergency to storage."""
        # Arrange
        command = ReportEmergencyCommand(alert=sample_alert)

        # Act
        await report_emergency_handler.handle(command)

        # Assert
        emergency_calls = mock_realtime_storage.get_emergency_calls()
        assert len(emergency_calls) == 1
        assert emergency_calls[0][0] == "save_emergency"

        # Verify the emergency was saved with correct data
        emergency = emergency_calls[0][1]
        assert emergency.alert == sample_alert
        assert emergency.status == EmergencyStatus.RECEIVED
        assert emergency.assignedTo is None

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_report_emergency_reports_to_coordinator(
        self, report_emergency_handler, sample_alert, mock_coordinator_port
    ):
        """Test that the use case reports the emergency to the coordinator."""
        # Arrange
        command = ReportEmergencyCommand(alert=sample_alert)

        # Act
        await report_emergency_handler.handle(command)

        # Assert
        coordinator_calls = mock_coordinator_port.get_report_emergency_calls()
        assert len(coordinator_calls) == 1

        # Verify the reported emergency has correct data
        reported_emergency = coordinator_calls[0]
        assert reported_emergency.alert == sample_alert
        assert reported_emergency.status == EmergencyStatus.RECEIVED

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_report_emergency_creates_unique_emergency_id(
        self, report_emergency_handler, sample_alert, mock_realtime_storage
    ):
        """Test that the use case creates a unique ID for each emergency."""
        # Arrange
        command1 = ReportEmergencyCommand(alert=sample_alert)
        command2 = ReportEmergencyCommand(alert=sample_alert)

        # Act
        await report_emergency_handler.handle(command1)
        await report_emergency_handler.handle(command2)

        # Assert
        emergency_calls = mock_realtime_storage.get_emergency_calls()
        assert len(emergency_calls) == 2

        # Verify that each emergency has a unique ID
        emergency1 = emergency_calls[0][1]
        emergency2 = emergency_calls[1][1]
        assert emergency1.id != emergency2.id

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_report_emergency_preserves_alert_information(
        self, report_emergency_handler, mock_realtime_storage
    ):
        """Test that the use case preserves all alert information."""
        # Arrange
        alert = Alert(
            location=Location(latitude=10.20, longitude=30.40),
            generatedOn=datetime(2023, 2, 15, 14, 30, 0),
            medicalInfo=MedicalInfo(),
        )
        command = ReportEmergencyCommand(alert=alert)

        # Act
        await report_emergency_handler.handle(command)

        # Assert
        emergency_calls = mock_realtime_storage.get_emergency_calls()
        assert len(emergency_calls) == 1

        # Verify all alert information is preserved
        emergency = emergency_calls[0][1]
        assert emergency.alert.location.latitude == 10.20
        assert emergency.alert.location.longitude == 30.40
        assert emergency.alert.generatedOn == datetime(2023, 2, 15, 14, 30, 0)
        assert emergency.alert.medicalInfo is not None

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_report_emergency_records_received_timestamp(
        self, report_emergency_handler, mock_realtime_storage
    ):
        """Test that the use case records the RECEIVED timestamp."""
        # Arrange
        alert = Alert(
            location=Location(latitude=1.0, longitude=2.0),
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=MedicalInfo(),
        )
        command = ReportEmergencyCommand(alert=alert)

        # Act
        await report_emergency_handler.handle(command)

        # Assert
        emergency_calls = mock_realtime_storage.get_emergency_calls()
        assert len(emergency_calls) == 1

        # Verify RECEIVED timestamp is recorded
        emergency = emergency_calls[0][1]
        assert EmergencyStatus.RECEIVED in emergency.timeline
        assert isinstance(emergency.timeline[EmergencyStatus.RECEIVED], datetime)

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_report_emergency_with_different_alerts(
        self, report_emergency_handler, mock_realtime_storage
    ):
        """Test that the use case handles different alerts correctly."""
        # Arrange
        alert1 = Alert(
            location=Location(latitude=1.0, longitude=2.0),
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=MedicalInfo(),
        )
        alert2 = Alert(
            location=Location(latitude=3.0, longitude=4.0),
            generatedOn=datetime(2023, 1, 2, 12, 0, 0),
            medicalInfo=MedicalInfo(),
        )

        command1 = ReportEmergencyCommand(alert=alert1)
        command2 = ReportEmergencyCommand(alert=alert2)

        # Act
        await report_emergency_handler.handle(command1)
        await report_emergency_handler.handle(command2)

        # Assert
        emergency_calls = mock_realtime_storage.get_emergency_calls()
        assert len(emergency_calls) == 2

        # Verify each emergency has the correct alert
        emergency1 = emergency_calls[0][1]
        emergency2 = emergency_calls[1][1]

        assert emergency1.alert.location.latitude == 1.0
        assert emergency1.alert.location.longitude == 2.0
        assert emergency1.alert.generatedOn == datetime(2023, 1, 1, 12, 0, 0)

        assert emergency2.alert.location.latitude == 3.0
        assert emergency2.alert.location.longitude == 4.0
        assert emergency2.alert.generatedOn == datetime(2023, 1, 2, 12, 0, 0)
