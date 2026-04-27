"""Test module for MockYamlMedicalCenterManagerAdapter

This module contains tests for the MockYamlMedicalCenterManagerAdapter class.
"""

import uuid

import pytest
from core.domain.entities.medical_center import ComplexityLevel, MedicalCenter
from core.domain.value_objects.location import Location

from docker_discovery.mock_adapters import MockYamlMedicalCenterManagerAdapter

# Test data - these IDs should match some entries in medical-centers.yaml
TEST_MEDICAL_CENTER_ID = uuid.UUID(
    "d005fa20-af65-4e81-9589-eb9630646fad"
)  # Hospital Pablo Tobón Uribe
TEST_LOCATION = Location(
    latitude=6.276725346666667, longitude=-75.57992334666666
)  # Same as above hospital


@pytest.mark.asyncio
async def test_get_medical_center_by_id():
    """Test that get_medical_center_by_id returns the correct medical center."""
    adapter = MockYamlMedicalCenterManagerAdapter("../medical-centers.yaml")

    # Test with existing ID
    result = await adapter.get_medical_center_by_id(TEST_MEDICAL_CENTER_ID)
    assert result is not None
    assert result.id == TEST_MEDICAL_CENTER_ID
    assert result.name == "Hospital Pablo Tobón Uribe"

    # Test with non-existing ID
    non_existent_id = uuid.uuid4()
    result = await adapter.get_medical_center_by_id(non_existent_id)
    assert result is None


@pytest.mark.asyncio
async def test_get_nearby_medical_center():
    """Test that get_nearby_medical_center returns medical centers filtered by complexity and sorted by distance."""
    adapter = MockYamlMedicalCenterManagerAdapter("../medical-centers.yaml")

    # Test with BASIC complexity level
    results = await adapter.get_nearby_medical_center(
        TEST_LOCATION, ComplexityLevel.BASIC
    )
    assert len(results) > 0
    # All results should have at least BASIC complexity
    for center in results:
        assert center.maxComplexityLevel.value >= ComplexityLevel.BASIC.value

    # Test with HIGH complexity level
    high_complexity_results = await adapter.get_nearby_medical_center(
        TEST_LOCATION, ComplexityLevel.HIGH
    )
    assert len(high_complexity_results) > 0
    # All results should have at least HIGH complexity
    for center in high_complexity_results:
        assert center.maxComplexityLevel.value >= ComplexityLevel.HIGH.value

    # Results should be sorted by distance (first result should be closest)
    if len(results) > 1:
        dist1 = (results[0].location.latitude - TEST_LOCATION.latitude) ** 2 + (
            results[0].location.longitude - TEST_LOCATION.longitude
        ) ** 2
        dist2 = (results[1].location.latitude - TEST_LOCATION.latitude) ** 2 + (
            results[1].location.longitude - TEST_LOCATION.longitude
        ) ** 2
        assert dist1 <= dist2


@pytest.mark.asyncio
async def test_medical_center_loading():
    """Test that the medical center database is loaded correctly."""
    adapter = MockYamlMedicalCenterManagerAdapter("../medical-centers.yaml")

    # Check that we have some medical centers loaded
    assert len(adapter._medicalCenterDb) > 0

    # Check that all medical centers have the expected structure
    for center_id, center in adapter._medicalCenterDb.items():
        assert isinstance(center_id, uuid.UUID)
        assert isinstance(center, MedicalCenter)
        assert hasattr(center, "id")
        assert hasattr(center, "name")
        assert hasattr(center, "location")
        assert hasattr(center, "maxComplexityLevel")
