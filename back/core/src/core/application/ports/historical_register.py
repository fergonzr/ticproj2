from datetime import datetime
from typing import AsyncIterator, List

from cqrs.events.event import uuid

from core.application.ports.port import Port
from core.domain.entities.historical_emergency import HistoricalEmergency


class HistoricalRegisterPort(Port):
    """Interface to the historical register persistent storage."""

    async def save_emergency(self, emergency: HistoricalEmergency):
        """Save the emergency data to the historical storage."""
        raise NotImplementedError

    async def get_emergency(self, id: uuid.UUID) -> HistoricalEmergency | None:
        """Retrieve an emergency historical register from the
        persistent storage database."""
        raise NotImplementedError

    async def get_emergency_by_filing_number(
        self, filingNo: int
    ) -> HistoricalEmergency | None:
        """Get a historical emergency by filing number"""
        raise NotImplementedError

    def get_emergencies_in_daterange(
        self, since: datetime, to: datetime = datetime.now()
    ) -> AsyncIterator[HistoricalEmergency]:
        """Get the emergencies on the given data range"""
        raise NotImplementedError
