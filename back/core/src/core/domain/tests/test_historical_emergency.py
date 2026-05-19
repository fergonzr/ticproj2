"""Unit tests for the HistoricalEmergency entity.

Focuses on HistoricalEmergency.from_emergency carrying over the
paramedic's on-site complexity retriage.
"""

from datetime import datetime

from core.domain.entities.emergency import Emergency
from core.domain.entities.historical_emergency import HistoricalEmergency
from core.domain.entities.medical_center import ComplexityLevel
from core.domain.value_objects.alert import Alert
from core.domain.value_objects.location import Location


def _sample_emergency() -> Emergency:
    """A freshly received emergency, as produced by Emergency.from_alert."""
    alert = Alert(
        location=Location(latitude=12.34, longitude=56.78),
        generatedOn=datetime(2023, 1, 1, 12, 0, 0),
        medicalInfo=None,
    )
    return Emergency.from_alert(alert)


class TestHistoricalEmergencyFromEmergency:
    """Test cases for HistoricalEmergency.from_emergency."""

    def test_from_emergency_copies_complexity_level(self):
        """The paramedic's complexity retriage is carried into history."""
        emergency = _sample_emergency()
        emergency.complexityLevel = ComplexityLevel.HIGH

        historical = HistoricalEmergency.from_emergency(emergency)

        assert historical.complexityLevel == ComplexityLevel.HIGH

    def test_from_emergency_keeps_complexity_level_none_when_unset(self):
        """An emergency never retriaged on site archives with None."""
        emergency = _sample_emergency()

        historical = HistoricalEmergency.from_emergency(emergency)

        assert historical.complexityLevel is None
