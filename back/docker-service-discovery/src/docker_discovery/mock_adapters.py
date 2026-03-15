"""Mock adapters module

This module defines the various set of adapters whose real
implementation fall beyond the scope of the project.
This is generally because they represent functionality provided by
external systems that we don't have access to at the moment.
"""

import logging
import uuid

from core.application.ports.user_manager import UserManagerPort
from core.domain.entities.user import User
from serde.yaml import from_yaml
from typing_extensions import Dict

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

# This is resolved relative to the pwd of the current python process,
# which should generally be the back/ directory if running in a docker
# container (which you should for non-test purposes)
USER_DATABSE_FILE = "users.yaml"


class MockYamlUserManagerAdapter(UserManagerPort):
    _userDb: Dict[uuid.UUID, User]

    def __init__(self, filePath: str = USER_DATABSE_FILE):
        self._load_userDb(filePath)

    def _load_userDb(self, filePath: str):
        self._userDb = {}
        with open(filePath, "r") as file:
            data = "\n".join(file.readlines())
            self._userDb = from_yaml(Dict[uuid.UUID, User], data)

    async def get_user[T: User](self, id: uuid.UUID) -> T | None:
        return self._userDb.get(id, None)
