from typing import Awaitable, Callable

import cqrs
from pydantic import BaseModel

from core.application.use_cases import DefaultedNotificationEvent

from . import Port


class NotificationEventBinderPort(Port):
    """A port to allow binding handlers for specific notification events."""

    async def bind(
        self,
        eventType: type[DefaultedNotificationEvent],
        handler: Callable[[BaseModel], Awaitable[None]],
    ):
        """Bind handler to a specific type of event.

        Args:
            eventType: The type of events that the handler expects.
            handler: an async Callable that to handle such events. It
            must accept objects of type eventType.payloadModel as its
            first and only argument.
        """
        raise NotImplementedError()
