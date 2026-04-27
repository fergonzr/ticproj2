import pytest
from core.application.ports import Service
from core.application.ports.historical_register import HistoricalRegisterPort
from port_integration_tests.historical_register import *
from pymongo import MongoClient

from mongo_historical_register import MongoHistoricalRegisterAdapter
from mongo_historical_register.register import (
    DATABASE_NAME,
    EMERGENCIES_COLLECTION_NAME,
)


@pytest.fixture
def adapter() -> HistoricalRegisterPort:
    return MongoHistoricalRegisterAdapter(
        Service("localhost", 27017, "root", "password")
    )


@pytest.fixture(autouse=True)
def cleanup_mongo():
    yield

    syncClient = MongoClient("mongodb://root:password@localhost:27017")
    syncClient[DATABASE_NAME].drop_collection(EMERGENCIES_COLLECTION_NAME)
