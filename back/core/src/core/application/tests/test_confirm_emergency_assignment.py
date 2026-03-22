"""Tests for the ConfirmEmergencyAssignment use case.

This module contains unit tests for the ConfirmEmergencyAssignment use case,
which handles confirming that a paramedic has been assigned to an emergency.
"""

import uuid
from datetime import datetime

import pytest

from core.application.tests.mock_adapters import (
    mock_coordinator_port,
    mock_realtime_storage,
)
from core.application.use_cases.confirm_emergency_assignment import (
    ConfirmEmergencyAssignmentCommand,
    ConfirmEmergencyAssignmentHandler,
)
from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.entities.user import Paramedic, UserNotFoundError
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.medical_info import MedicalInfo
from core.domain.value_objects.resource import LocatableResource


@pytest.fixture
def confirm_emergency_assignment_handler(
    mock_realtime_storage, mock_coordinator_port
) -> ConfirmEmergencyAssignmentHandler:
    """Fixture that provides a handler configured with mock adapters
    for testing the ConfirmEmergencyAssignment use case."""
    return ConfirmEmergencyAssignmentHandler(
        storage=mock_realtime_storage, coordinator=mock_coordinator_port
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


@pytest.fixture
def sample_paramedic() -> Paramedic:
    """Fixture that provides a sample paramedic for testing."""
    paramedic_id = uuid.uuid4()
    return Paramedic(
        id=paramedic_id,
        name="John Doe",
        email="john.doe@example.com",
        passwordHash="hashed_password_sample",
        resource=LocatableResource(location=Location(latitude=1.0, longitude=2.0)),
        assignedEmergencyId=None,
    )


class TestConfirmEmergencyAssignmentUseCase:
    """Test cases for the ConfirmEmergencyAssignment use case."""

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_confirm_emergency_assignment_updates_emergency_status(
        self,
        confirm_emergency_assignment_handler,
        sample_emergency,
        sample_paramedic,
        mock_realtime_storage,
        mock_coordinator_port,
    ):
        """Test that the use case updates the emergency status to ASSIGNED."""
        # Arrange
        # Save both emergency and paramedic first
        await mock_realtime_storage.save_emergency(sample_emergency)
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        command = ConfirmEmergencyAssignmentCommand(
            paramedicId=sample_paramedic.id,
            paramedicLocation=sample_paramedic.resource.location,
            emergencyId=sample_emergency.id,
        )

        # Act
        await confirm_emergency_assignment_handler.handle(command)

        # Assert
        # Verify the emergency status was updated
        emergency_calls = mock_realtime_storage.get_emergency_calls()
        assert len(emergency_calls) == 2  # One save for initial, one for update
        updated_emergency = emergency_calls[1][1]
        assert updated_emergency.status == EmergencyStatus.ASSIGNED

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_confirm_emergency_assignment_updates_paramedic_assignment(
        self,
        confirm_emergency_assignment_handler,
        sample_emergency,
        sample_paramedic,
        mock_realtime_storage,
        mock_coordinator_port,
    ):
        """Test that the use case updates the paramedic's assigned emergency."""
        # Arrange
        # Save both emergency and paramedic first
        await mock_realtime_storage.save_emergency(sample_emergency)
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        command = ConfirmEmergencyAssignmentCommand(
            paramedicId=sample_paramedic.id,
            paramedicLocation=sample_paramedic.resource.location,
            emergencyId=sample_emergency.id,
        )

        # Act
        await confirm_emergency_assignment_handler.handle(command)

        # Assert
        # Verify the paramedic's assigned emergency was updated
        paramedic_calls = mock_realtime_storage.get_paramedic_calls()
        assert len(paramedic_calls) == 2  # One save for initial, one for update
        updated_paramedic = paramedic_calls[1][1]
        assert updated_paramedic.assignedEmergencyId is not None
        assert updated_paramedic.resource.busy is True

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_confirm_emergency_assignment_reports_to_coordinator(
        self,
        confirm_emergency_assignment_handler,
        sample_emergency,
        sample_paramedic,
        mock_realtime_storage,
        mock_coordinator_port,
    ):
        """Test that the use case reports the assignment to the coordinator."""
        # Arrange
        # Save both emergency and paramedic first
        await mock_realtime_storage.save_emergency(sample_emergency)
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        command = ConfirmEmergencyAssignmentCommand(
            paramedicId=sample_paramedic.id,
            paramedicLocation=sample_paramedic.resource.location,
            emergencyId=sample_emergency.id,
        )

        # Act
        await confirm_emergency_assignment_handler.handle(command)

        # Assert
        # Verify the assignment was reported to the coordinator
        assignment_calls = mock_coordinator_port.get_report_assignment_calls()
        assert len(assignment_calls) == 1
        reported_emergency, reported_paramedic = assignment_calls[0]
        assert reported_emergency.id == sample_emergency.id
        assert reported_paramedic.id == sample_paramedic.id

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_confirm_emergency_assignment_with_nonexistent_emergency(
        self,
        confirm_emergency_assignment_handler,
        sample_paramedic,
        mock_realtime_storage,
    ):
        """Test that the use case raises EmergencyNotFoundError when emergency doesn't exist."""
        # Arrange
        # Save only the paramedic
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        command = ConfirmEmergencyAssignmentCommand(
            paramedicId=sample_paramedic.id,
            paramedicLocation=sample_paramedic.resource.location,
            emergencyId=uuid.uuid4(),  # Non-existent emergency
        )

        # Act & Assert
        with pytest.raises(Exception):  # Should raise EmergencyNotFoundError
            await confirm_emergency_assignment_handler.handle(command)

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_confirm_emergency_assignment_with_nonexistent_paramedic(
        self,
        confirm_emergency_assignment_handler,
        sample_emergency,
        mock_realtime_storage,
    ):
        """Test that the use case raises UserNotFoundError when paramedic doesn't exist."""
        # Arrange
        # Save only the emergency
        await mock_realtime_storage.save_emergency(sample_emergency)

        paramedic_id = uuid.uuid4()
        command = ConfirmEmergencyAssignmentCommand(
            paramedicId=paramedic_id,
            paramedicLocation=Location(latitude=1.0, longitude=2.0),
            emergencyId=sample_emergency.id,
        )

        # Act & Assert
        with pytest.raises(UserNotFoundError):
            await confirm_emergency_assignment_handler.handle(command)

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_confirm_emergency_assignment_with_different_combinations(
        self,
        confirm_emergency_assignment_handler,
        mock_realtime_storage,
        mock_coordinator_port,
    ):
        """Test that the use case handles different emergency-paramedic combinations."""
        # Arrange
        # Create two emergencies
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

        # Create two paramedics
        paramedic_id1 = uuid.uuid4()
        paramedic1 = Paramedic(
            id=paramedic_id1,
            name="John Doe",
            email="john.doe@example.com",
            passwordHash="hashed_password_combo_1",
            resource=LocatableResource(location=Location(latitude=1.0, longitude=2.0)),
            assignedEmergencyId=None,
        )

        paramedic_id2 = uuid.uuid4()
        paramedic2 = Paramedic(
            id=paramedic_id2,
            name="Jane Smith",
            email="jane.smith@example.com",
            passwordHash="hashed_password_combo_2",
            resource=LocatableResource(location=Location(latitude=3.0, longitude=4.0)),
            assignedEmergencyId=None,
        )

        # Save all
        await mock_realtime_storage.save_emergency(emergency1)
        await mock_realtime_storage.save_emergency(emergency2)
        await mock_realtime_storage.save_paramedic(paramedic1)
        await mock_realtime_storage.save_paramedic(paramedic2)

        # Test different combinations
        command1 = ConfirmEmergencyAssignmentCommand(
            paramedicId=paramedic_id1,
            paramedicLocation=paramedic1.resource.location,
            emergencyId=emergency1.id,
        )

        command2 = ConfirmEmergencyAssignmentCommand(
            paramedicId=paramedic_id2,
            paramedicLocation=paramedic2.resource.location,
            emergencyId=emergency2.id,
        )

        # Create a third paramedic for the third assignment
        paramedic_id3 = uuid.uuid4()
        paramedic3 = Paramedic(
            id=paramedic_id3,
            name="Bob Johnson",
            email="bob.johnson@example.com",
            passwordHash="hashed_password_combo_3",
            resource=LocatableResource(location=Location(latitude=5.0, longitude=6.0)),
            assignedEmergencyId=None,
        )

        # Save the third paramedic
        await mock_realtime_storage.save_paramedic(paramedic3)

        command3 = ConfirmEmergencyAssignmentCommand(
            paramedicId=paramedic_id3,
            paramedicLocation=paramedic3.resource.location,
            emergencyId=emergency2.id,
        )

        # Act
        await confirm_emergency_assignment_handler.handle(command1)
        await confirm_emergency_assignment_handler.handle(command2)
        await confirm_emergency_assignment_handler.handle(command3)

        # Assert
        # Verify all assignments were reported to coordinator
        assignment_calls = mock_coordinator_port.get_report_assignment_calls()
        assert len(assignment_calls) == 3

        # Verify the correct combinations
        assert assignment_calls[0][0].id == emergency1.id
        assert assignment_calls[0][1].id == paramedic_id1

        assert assignment_calls[1][0].id == emergency2.id
        assert assignment_calls[1][1].id == paramedic_id2

        assert assignment_calls[2][0].id == emergency2.id
        assert assignment_calls[2][1].id == paramedic_id3
