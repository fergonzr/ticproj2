"""Query to retrieve every active paramedic, regardless of emergency context.

Returns the full roster of paramedics currently registered in realtime storage
along with their availability state. The caller decides how to render them
(e.g., counters in the operator dashboard, lists of free paramedics).
"""

from typing import ClassVar

import cqrs

from core.application.ports.realtime_storage import RealTimeStoragePort
from core.domain.entities.user import Paramedic

from . import DefaultedRequest


class GetActiveParamedicsQuery(DefaultedRequest):
    """Request to list every paramedic currently registered in realtime storage."""


class GetActiveParamedicsQueryResult(cqrs.Response):
    """Result of the GetActiveParamedicsQuery.

    Attributes:
        paramedics: All paramedics currently in the realtime storage. The list
        may include paramedics without `resource` (just-connected, no GPS yet)
        and busy/assigned paramedics — callers must filter as needed.
    """

    paramedics: list[Paramedic]


class GetActiveParamedicsHandler(
    cqrs.RequestHandler[GetActiveParamedicsQuery, GetActiveParamedicsQueryResult]
):
    """Reads the full paramedic roster from realtime storage."""

    def __init__(self, realtimeStorage: RealTimeStoragePort):
        super().__init__()
        self.realtimeStorage = realtimeStorage

    @property
    def events(self) -> list[cqrs.Event]:
        return []

    def clear_events(self) -> None:
        pass

    async def handle(self, request: GetActiveParamedicsQuery) -> GetActiveParamedicsQueryResult:
        paramedics = await self.realtimeStorage.get_all_paramedics()
        return GetActiveParamedicsQueryResult(paramedics=paramedics)


GetActiveParamedicsQuery.defaultHandler: ClassVar[type[cqrs.RequestHandler]] = (
    GetActiveParamedicsHandler
)
