import uuid
from datetime import datetime
from typing import AsyncIterator

from core.application.ports import Service
from core.application.ports.historical_register import (
    HistoricalEmergency,
    HistoricalRegisterPort,
)
from core.domain.entities.emergency import EmergencyStatus
from pymongo import AsyncMongoClient
from serde import from_dict, from_tuple, to_dict

DATABASE_NAME = "sie"
EMERGENCIES_COLLECTION_NAME = "historical_emergencies"


class MongoHistoricalRegisterAdapter(HistoricalRegisterPort):
    requiredServices = ["mongo"]

    def __init__(self, mongo: Service) -> None:
        uri = f"mongodb://{mongo.username}:{mongo.password}@{mongo.host}:{mongo.port}"
        self._mongoClient = AsyncMongoClient(uri, uuidRepresentation="standard")
        self._mongoDb = self._mongoClient[DATABASE_NAME]

    async def save_emergency(self, emergency: HistoricalEmergency):
        document = to_dict(emergency)
        await self._mongoDb[EMERGENCIES_COLLECTION_NAME].insert_one(document)

    async def get_emergency(self, id: uuid.UUID) -> HistoricalEmergency | None:
        document = (
            await self._mongoDb[EMERGENCIES_COLLECTION_NAME].find_one({"id": str(id)}),
        )
        if document == (None,) or not isinstance(document[0], dict):
            return None

        return from_dict(HistoricalEmergency, document[0])

    async def get_emergency_by_filing_number(
        self, filingNo: int
    ) -> HistoricalEmergency | None:
        document = (
            await self._mongoDb[EMERGENCIES_COLLECTION_NAME].find_one(
                {"filingNumber": filingNo}
            ),
        )
        if document == (None,) or not isinstance(document[0], dict):
            return None

        return from_dict(HistoricalEmergency, document[0])

    async def get_emergencies_in_daterange(
        self, since: datetime, to: datetime = datetime.now()
    ) -> AsyncIterator[HistoricalEmergency]:
        since = since.replace(tzinfo=None)
        to = to.replace(tzinfo=None)

        cursor = self._mongoDb[EMERGENCIES_COLLECTION_NAME].find()

        async for element in cursor:
            if element is not None and isinstance(element, dict):
                historicalEmergency = from_dict(HistoricalEmergency, element)
                # TODO: Delegate the filtering to the database itself

                if (
                    EmergencyStatus.RECEIVED in historicalEmergency.timeline.keys()
                    and historicalEmergency.timeline[EmergencyStatus.RECEIVED] >= since
                    and historicalEmergency.timeline[EmergencyStatus.RECEIVED] <= to
                ):
                    yield historicalEmergency
