import dataclasses
import uuid

import pytest
from core.domain.entities.user import Paramedic, User, UserRole

from docker_discovery.mock_adapters import MockYamlUserManagerAdapter

# An extermely simple test suite that actually will need to be updated
# if the users.yaml file gets updated. Beware.


@pytest.mark.asyncio
async def test_mock_yaml_adapter():
    userManager = MockYamlUserManagerAdapter("../users.yaml")
    userId = uuid.UUID("77e22242-8aaf-488d-b4ec-256a43bb67b0")

    user = await userManager.get_user(userId)

    assert user is not None
    assert user.id == userId
    assert user.name == "Javier"
    assert user.email == "javier@example.com"
    assert user.userRole == UserRole.PARAMEDIC


@pytest.mark.asyncio
async def test_retrieved_user_conversion_works():
    userManager = MockYamlUserManagerAdapter("../users.yaml")
    userId = uuid.UUID("77e22242-8aaf-488d-b4ec-256a43bb67b0")

    user = await userManager.get_user(userId)
    assert user is not None
    assert user.userRole == UserRole.PARAMEDIC
    paramedic = Paramedic(**dataclasses.asdict(user))
    assert paramedic.resource is None
    assert paramedic.assignedEmergencyId is None
