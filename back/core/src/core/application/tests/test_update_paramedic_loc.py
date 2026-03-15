"""Tests for the UpdateParamedicLocation use case.

This module contains unit tests for the UpdateParamedicLocation use case,
which handles updating the location of a paramedic's resource.
"""

import uuid
from datetime import datetime

import pytest

from core.application.tests.mock_adapters import mock_realtime_storage
from core.application.use_cases.update_paramedic_loc import (
    UpdateParamedicLocationCommand,
    UpdateParamedicLocationHandler,
)
from core.domain.entities.user import Paramedic, UserNotFoundError
from core.domain.value_objects.location import Location
from core.domain.value_objects.resource import LocatableResource


@pytest.fixture
def update_paramedic_location_handler(
    mock_realtime_storage,
) -> UpdateParamedicLocationHandler:
    """Fixture that provides a handler configured with mock adapters
    for testing the UpdateParamedicLocation use case."""
    return UpdateParamedicLocationHandler(storage=mock_realtime_storage)


@pytest.fixture
def sample_paramedic() -> Paramedic:
    """Fixture that provides a sample paramedic for testing."""
    paramedic_id = uuid.uuid4()
    initial_location = Location(latitude=1.0, longitude=2.0)
    return Paramedic(
        id=paramedic_id,
        name="John Doe",
        email="john.doe@example.com",
        resource=LocatableResource(location=initial_location),
        assignedEmergencyId=None,
    )


class TestUpdateParamedicLocationUseCase:
    """Test cases for the UpdateParamedicLocation use case."""

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_update_paramedic_location_updates_location(
        self,
        update_paramedic_location_handler,
        sample_paramedic,
        mock_realtime_storage,
    ):
        """Test that the use case updates the paramedic's location."""
        # Arrange
        # Save the paramedic first
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        new_location = Location(latitude=3.0, longitude=4.0)
        command = UpdateParamedicLocationCommand(
            paramedicId=sample_paramedic.id,
            lastLocation=sample_paramedic.resource.location,
            newLocation=new_location,
        )

        # Act
        await update_paramedic_location_handler.handle(command)

        # Assert
        # Verify the paramedic's location was updated
        paramedic_calls = mock_realtime_storage.get_paramedic_calls()
        save_calls = [call for call in paramedic_calls if call[0] == "save_paramedic"]
        assert len(save_calls) == 2  # One save for initial, one for update

        updated_paramedic = save_calls[1][1]
        assert updated_paramedic.resource.location == new_location
        assert updated_paramedic.resource.location.latitude == 3.0
        assert updated_paramedic.resource.location.longitude == 4.0

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_update_paramedic_location_with_nonexistent_paramedic(
        self,
        update_paramedic_location_handler,
    ):
        """Test that the use case raises UserNotFoundError when paramedic doesn't exist."""
        # Arrange
        paramedic_id = uuid.uuid4()
        last_location = Location(latitude=1.0, longitude=2.0)
        new_location = Location(latitude=3.0, longitude=4.0)

        command = UpdateParamedicLocationCommand(
            paramedicId=paramedic_id,
            lastLocation=last_location,
            newLocation=new_location,
        )

        # Act & Assert
        with pytest.raises(UserNotFoundError):
            await update_paramedic_location_handler.handle(command)

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_update_paramedic_location_with_different_paramedics(
        self,
        update_paramedic_location_handler,
        mock_realtime_storage,
    ):
        """Test that the use case can update locations for different paramedics."""
        # Arrange
        # Create two paramedics
        paramedic_id1 = uuid.uuid4()
        paramedic1 = Paramedic(
            id=paramedic_id1,
            name="John Doe",
            email="john.doe@example.com",
            resource=LocatableResource(location=Location(latitude=1.0, longitude=2.0)),
            assignedEmergencyId=None,
        )

        paramedic_id2 = uuid.uuid4()
        paramedic2 = Paramedic(
            id=paramedic_id2,
            name="Jane Smith",
            email="jane.smith@example.com",
            resource=LocatableResource(location=Location(latitude=3.0, longitude=4.0)),
            assignedEmergencyId=None,
        )

        # Save both paramedics
        await mock_realtime_storage.save_paramedic(paramedic1)
        await mock_realtime_storage.save_paramedic(paramedic2)

        # Create update commands
        command1 = UpdateParamedicLocationCommand(
            paramedicId=paramedic_id1,
            lastLocation=paramedic1.resource.location,
            newLocation=Location(latitude=5.0, longitude=6.0),
        )

        command2 = UpdateParamedicLocationCommand(
            paramedicId=paramedic_id2,
            lastLocation=paramedic2.resource.location,
            newLocation=Location(latitude=7.0, longitude=8.0),
        )

        # Act
        await update_paramedic_location_handler.handle(command1)
        await update_paramedic_location_handler.handle(command2)

        # Assert
        # Verify both paramedics were updated
        paramedic_calls = mock_realtime_storage.get_paramedic_calls()
        save_calls = [call for call in paramedic_calls if call[0] == "save_paramedic"]
        assert len(save_calls) == 4  # Two initial saves, two updates

        # Verify the correct paramedics were updated
        # Find the updated paramedics by their IDs
        updated_paramedics = {call[1].id: call[1] for call in save_calls}

        # Verify paramedic1 was updated correctly
        assert paramedic_id1 in updated_paramedics
        updated_paramedic1 = updated_paramedics[paramedic_id1]
        assert updated_paramedic1.resource.location.latitude == 5.0
        assert updated_paramedic1.resource.location.longitude == 6.0

        # Verify paramedic2 was updated correctly
        assert paramedic_id2 in updated_paramedics
        updated_paramedic2 = updated_paramedics[paramedic_id2]
        assert updated_paramedic2.resource.location.latitude == 7.0
        assert updated_paramedic2.resource.location.longitude == 8.0

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_update_paramedic_location_preserves_other_properties(
        self,
        update_paramedic_location_handler,
        sample_paramedic,
        mock_realtime_storage,
    ):
        """Test that the use case preserves other paramedic properties."""
        # Arrange
        # Save the paramedic first
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        new_location = Location(latitude=3.0, longitude=4.0)
        command = UpdateParamedicLocationCommand(
            paramedicId=sample_paramedic.id,
            lastLocation=sample_paramedic.resource.location,
            newLocation=new_location,
        )

        # Act
        await update_paramedic_location_handler.handle(command)

        # Assert
        # Verify other properties are preserved
        paramedic_calls = mock_realtime_storage.get_paramedic_calls()
        save_calls = [call for call in paramedic_calls if call[0] == "save_paramedic"]
        updated_paramedic = save_calls[1][1]

        assert updated_paramedic.id == sample_paramedic.id
        assert updated_paramedic.name == "John Doe"
        assert updated_paramedic.email == "john.doe@example.com"
        assert updated_paramedic.assignedEmergencyId is None
        assert updated_paramedic.resource.busy is False

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_update_paramedic_location_with_multiple_updates(
        self,
        update_paramedic_location_handler,
        sample_paramedic,
        mock_realtime_storage,
    ):
        """Test that the use case can handle multiple location updates for the same paramedic."""
        # Arrange
        # Save the paramedic first
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        # Create multiple update commands
        command1 = UpdateParamedicLocationCommand(
            paramedicId=sample_paramedic.id,
            lastLocation=sample_paramedic.resource.location,
            newLocation=Location(latitude=3.0, longitude=4.0),
        )

        command2 = UpdateParamedicLocationCommand(
            paramedicId=sample_paramedic.id,
            lastLocation=Location(latitude=3.0, longitude=4.0),
            newLocation=Location(latitude=5.0, longitude=6.0),
        )

        # Act
        await update_paramedic_location_handler.handle(command1)
        await update_paramedic_location_handler.handle(command2)

        # Assert
        # Verify the paramedic's location was updated twice
        paramedic_calls = mock_realtime_storage.get_paramedic_calls()
        save_calls = [call for call in paramedic_calls if call[0] == "save_paramedic"]
        assert len(save_calls) == 3  # One initial save, two updates

        # Verify the final location is correct
        final_paramedic = save_calls[2][1]
        assert final_paramedic.resource.location.latitude == 5.0
        assert final_paramedic.resource.location.longitude == 6.0

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_update_paramedic_location_deletes_old_entry(
        self,
        update_paramedic_location_handler,
        sample_paramedic,
        mock_realtime_storage,
    ):
        """Test that the use case deletes the old paramedic entry."""
        # Arrange
        # Save the paramedic first
        await mock_realtime_storage.save_paramedic(sample_paramedic)

        new_location = Location(latitude=3.0, longitude=4.0)
        command = UpdateParamedicLocationCommand(
            paramedicId=sample_paramedic.id,
            lastLocation=sample_paramedic.resource.location,
            newLocation=new_location,
        )

        # Act
        await update_paramedic_location_handler.handle(command)

        # Assert
        # Verify the old entry was deleted
        delete_calls = mock_realtime_storage.get_paramedic_calls()
        delete_calls = [call for call in delete_calls if call[0] == "delete_paramedic"]
        assert len(delete_calls) == 1
        assert delete_calls[0][1].id == sample_paramedic.id
