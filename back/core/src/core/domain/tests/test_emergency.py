"""Unit tests for the Emergency entity.

This module contains unit tests for the Emergency class, focusing on:
1. Creating an Emergency from an Alert
2. Assigning a paramedic to an Emergency
3. Ensuring correct information is passed during creation and assignment
"""

import uuid
from datetime import datetime

from core.domain.entities.emergency import Emergency, EmergencyStatus
from core.domain.entities.user import Paramedic
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location
from core.domain.value_objects.medical_info import MedicalInfo


class TestEmergencyCreation:
    """Test cases for creating Emergency instances from Alerts."""

    def test_from_alert_creates_emergency_with_correct_id(self):
        """Test that from_alert creates an emergency with a valid UUID."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )

        # Act
        emergency = Emergency.from_alert(alert)

        # Assert
        assert isinstance(emergency.id, uuid.UUID)

    def test_from_alert_preserves_alert_information(self):
        """Test that from_alert preserves the alert information."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )

        # Act
        emergency = Emergency.from_alert(alert)

        # Assert
        assert emergency.alert == alert
        assert emergency.alert.location == location
        assert emergency.alert.generatedOn == datetime(2023, 1, 1, 12, 0, 0)
        assert emergency.alert.medicalInfo == medical_info

    def test_from_alert_sets_correct_initial_status(self):
        """Test that from_alert sets the initial status to RECEIVED."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )

        # Act
        emergency = Emergency.from_alert(alert)

        # Assert
        assert emergency.status == EmergencyStatus.RECEIVED

    def test_from_alert_sets_assigned_to_none(self):
        """Test that from_alert sets assignedTo to None."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )

        # Act
        emergency = Emergency.from_alert(alert)

        # Assert
        assert emergency.assignedTo is None

    def test_from_alert_sets_triage_to_none(self):
        """Test that from_alert sets triage to None."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )

        # Act
        emergency = Emergency.from_alert(alert)

        # Assert
        assert emergency.triage is None

    def test_from_alert_records_received_timestamp(self):
        """Test that from_alert records the RECEIVED timestamp."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )

        # Act
        emergency = Emergency.from_alert(alert)

        # Assert
        assert EmergencyStatus.RECEIVED in emergency.timeline
        assert isinstance(emergency.timeline[EmergencyStatus.RECEIVED], datetime)


class TestEmergencyAssignment:
    """Test cases for assigning paramedics to emergencies."""

    def test_assign_to_updates_paramedic_reference(self):
        """Test that assign_to updates the paramedic reference."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )
        emergency = Emergency.from_alert(alert)

        paramedic_id = uuid.uuid4()
        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            resource=None,
            assignedEmergencyId=None,
        )

        # Act
        emergency.assign_to(paramedic)

        # Assert
        assert emergency.assignedTo == paramedic

    def test_assign_to_updates_status(self):
        """Test that assign_to updates the emergency status to ASSIGNED."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )
        emergency = Emergency.from_alert(alert)

        paramedic_id = uuid.uuid4()
        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            resource=None,
            assignedEmergencyId=None,
        )

        # Act
        emergency.assign_to(paramedic)

        # Assert
        assert emergency.status == EmergencyStatus.ASSIGNED

    def test_assign_to_records_assigned_timestamp(self):
        """Test that assign_to records the ASSIGNED timestamp."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )
        emergency = Emergency.from_alert(alert)

        paramedic_id = uuid.uuid4()
        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            resource=None,
            assignedEmergencyId=None,
        )

        # Act
        emergency.assign_to(paramedic)

        # Assert
        assert EmergencyStatus.ASSIGNED in emergency.timeline
        assert isinstance(emergency.timeline[EmergencyStatus.ASSIGNED], datetime)

    def test_assign_to_preserves_alert_information(self):
        """Test that assign_to preserves the alert information."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )
        emergency = Emergency.from_alert(alert)

        paramedic_id = uuid.uuid4()
        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            resource=None,
            assignedEmergencyId=None,
        )

        # Act
        emergency.assign_to(paramedic)

        # Assert
        assert emergency.alert == alert
        assert emergency.alert.location == location
        assert emergency.alert.generatedOn == datetime(2023, 1, 1, 12, 0, 0)
        assert emergency.alert.medicalInfo == medical_info

    def test_assign_to_preserves_emergency_id(self):
        """Test that assign_to preserves the emergency ID."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )
        emergency = Emergency.from_alert(alert)
        original_id = emergency.id

        paramedic_id = uuid.uuid4()
        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            resource=None,
            assignedEmergencyId=None,
        )

        # Act
        emergency.assign_to(paramedic)

        # Assert
        assert emergency.id == original_id


class TestEmergencyStateTransitions:
    """Test cases for emergency state transitions."""

    def test_initial_state_is_received(self):
        """Test that a newly created emergency has RECEIVED status."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )

        # Act
        emergency = Emergency.from_alert(alert)

        # Assert
        assert emergency.status == EmergencyStatus.RECEIVED

    def test_assignment_changes_status_to_assigned(self):
        """Test that assigning a paramedic changes status to ASSIGNED."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )
        emergency = Emergency.from_alert(alert)

        paramedic_id = uuid.uuid4()
        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            resource=None,
            assignedEmergencyId=None,
        )

        # Act
        emergency.assign_to(paramedic)

        # Assert
        assert emergency.status == EmergencyStatus.ASSIGNED

    def test_timeline_records_state_transitions(self):
        """Test that the timeline records all state transitions."""
        # Arrange
        location = Location(latitude=12.34, longitude=56.78)
        medical_info = MedicalInfo()
        alert = Alert(
            location=location,
            generatedOn=datetime(2023, 1, 1, 12, 0, 0),
            medicalInfo=medical_info,
        )
        emergency = Emergency.from_alert(alert)

        paramedic_id = uuid.uuid4()
        paramedic = Paramedic(
            id=paramedic_id,
            name="John Doe",
            email="john.doe@example.com",
            resource=None,
            assignedEmergencyId=None,
        )

        # Act
        # Initial state
        received_time = emergency.timeline[EmergencyStatus.RECEIVED]

        # Assignment
        emergency.assign_to(paramedic)
        assigned_time = emergency.timeline[EmergencyStatus.ASSIGNED]

        # Assert
        assert EmergencyStatus.RECEIVED in emergency.timeline
        assert EmergencyStatus.ASSIGNED in emergency.timeline
        assert received_time < assigned_time
