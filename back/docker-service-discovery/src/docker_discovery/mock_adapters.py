"""Mock adapters module

This module defines the various set of adapters whose real
implementation fall beyond the scope of the project.
This is generally because they represent functionality provided by
external systems that we don't have access to at the moment.
"""

import logging
import uuid

from core.application.ports.medical_center_manager import MedicalCenterManagerPort
from core.application.ports.user_manager import UserManagerPort
from core.domain.entities.medical_center import ComplexityLevel, MedicalCenter
from core.domain.entities.user import User
from core.domain.value_objects.location import Location
from serde.yaml import from_yaml
from typing_extensions import Dict, List

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
MEDICAL_CENTERS_DATABASE_FILE = "medical-centers.yaml"


class MockYamlUserManagerAdapter(UserManagerPort):
    _userDb: Dict[uuid.UUID, User]

    def __init__(self, filePath: str = USER_DATABSE_FILE):
        self._load_userDb(filePath)

    def _load_userDb(self, filePath: str):
        self._userDb = {}
        with open(filePath, "r") as file:
            data = "\n".join(file.readlines())
            self._userDb = from_yaml(Dict[uuid.UUID, User], data)

    async def get_user(self, id: uuid.UUID) -> User | None:
        return self._userDb.get(id, None)

    async def get_user_by_email(self, email: str) -> User | None:
        matchedUsers = [user for user in self._userDb.values() if user.email == email]
        if len(matchedUsers) == 0:
            return None
        return matchedUsers[0]


class MockYamlMedicalCenterManagerAdapter(MedicalCenterManagerPort):
    _medicalCenterDb: Dict[uuid.UUID, MedicalCenter]

    def __init__(self, filePath: str = MEDICAL_CENTERS_DATABASE_FILE):
        self._load_medicalCenterDb(filePath)

    def _load_medicalCenterDb(self, filePath: str):
        self._medicalCenterDb = {}
        with open(filePath, "r") as file:
            data = "\n".join(file.readlines())
            medical_centers = from_yaml(List[MedicalCenter], data)
            for center in medical_centers:
                self._medicalCenterDb[center.id] = center

    async def get_medical_center_by_id(self, id: uuid.UUID) -> MedicalCenter | None:
        return self._medicalCenterDb.get(id, None)

    async def get_nearby_medical_center(
        self, location: Location, complexityLevel: ComplexityLevel
    ) -> list[MedicalCenter]:
        # Filter medical centers by complexity level
        filtered_centers = [
            center
            for center in self._medicalCenterDb.values()
            if center.maxComplexityLevel.value >= complexityLevel.value
        ]

        # Calculate distance and sort by ascending distance
        def calculate_distance(center: MedicalCenter) -> float:
            # Simple Euclidean distance calculation (not geographically accurate but sufficient for mock)
            lat_diff = center.location.latitude - location.latitude
            lon_diff = center.location.longitude - location.longitude
            return (lat_diff**2 + lon_diff**2) ** 0.5

        filtered_centers.sort(key=calculate_distance)
        return filtered_centers

    async def get_all_medical_centers(self) -> list[MedicalCenter]:
        return list(self._medicalCenterDb.values())
