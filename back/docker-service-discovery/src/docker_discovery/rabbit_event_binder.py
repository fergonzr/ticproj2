import asyncio
import json
from typing import Awaitable, Callable, Dict, Tuple

import aio_pika
from aio_pika.abc import AbstractConnection, AbstractIncomingMessage
from core.application.ports import Service
from core.application.ports.event_binder import NotificationEventBinderPort
from core.application.use_cases import DefaultedNotificationEvent
from cqrs.events.event import PayloadT
from pydantic import BaseModel


class RabbitEventBinderAdapter(NotificationEventBinderPort):
    """Adapter for the NotifyEventBinderPort specific to RabbitMQ"""

    requiredServices = ["rabbit"]
    _bindings: Dict[
        str,
        Tuple[type[BaseModel], Callable[[BaseModel], Awaitable[None]]],
    ]
    _connection: AbstractConnection

    def __init__(self, rabbit: Service):
        self._ready = False
        self._serviceDirectory["rabbit"] = rabbit
        self._bindings = {}

    async def _connect(self):
        host = self._serviceDirectory["rabbit"].host
        port = self._serviceDirectory["rabbit"].port
        username = self._serviceDirectory["rabbit"].username
        password = self._serviceDirectory["rabbit"].password

        self._connection = await aio_pika.connect(
            f"amqp://{username}:{password}@{host}:{port}",
            loop=asyncio.get_running_loop(),
        )
        self._channel = await self._connection.channel()
        self._ready = True

    async def _notify(self, message: AbstractIncomingMessage):
        messageData = json.loads(message.body)
        payload = self._bindings[messageData["event_name"]][0].model_validate(
            messageData["payload"]
        )
        await self._bindings[messageData["event_name"]][1](payload)

    async def bind(
        self,
        eventType: type[DefaultedNotificationEvent],
        handler: Callable[[BaseModel], Awaitable[None]],
    ):
        if not self._ready:
            await self._connect()
        queue = await self._channel.declare_queue(eventType.topic)
        self._bindings[eventType.name] = (eventType.payloadModel, handler)

        await queue.consume(self._notify, no_ack=True)
