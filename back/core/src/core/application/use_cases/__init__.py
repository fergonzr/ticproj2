"""Use cases module for the application.

This module defines the base classes and interfaces for use cases in the application,
including the DefaultedRequest class which provides a default handler for CQRS requests.
"""

from typing import ClassVar

import cqrs
from cqrs.events.event import PayloadT
from pydantic import BaseModel


class DefaultedRequest(cqrs.Request):
    """Base class for requests that have a default handler.

    This class provides a default handler for CQRS requests, allowing for
    simplified use case implementation.

    Attributes:
        defaultHandler: A class variable that specifies the default handler
                       for this request type.
    """

    defaultHandler: ClassVar[type[cqrs.RequestHandler]]


class DefaultedNotificationEvent(cqrs.NotificationEvent):
    name: ClassVar[str]
    topic: ClassVar[str]
    payloadModel: ClassVar[type[BaseModel]]
