"""Operator connection pool module.

This module provides the OperatorConnectionPool class for managing
operator WebSocket connections and distributing emergencies to available operators.
"""

import logging
import uuid
from typing import Dict, Tuple

from fastapi import WebSocket

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


class OperatorConnectionPool:
    """Manages a pool of operator WebSocket connections and distributes emergencies.

    This class maintains a pool of operator connections and provides methods to
    manage operator connections and retrieve the next available operator in a
    round-robin fashion.
    """

    def __init__(self):
        """Initialize the operator connection pool."""
        self._operatorConnectionPool: Dict[uuid.UUID, Tuple[bool, WebSocket]] = {}
        self._emergencyCounter: int = 0

    def __getitem__(self, operatorId: uuid.UUID) -> WebSocket:
        """Get the specified operator connection, regardless of wether it is available or not.

        Args:
            operatorId: The id of the operator.
        """
        return self._operatorConnectionPool[operatorId][1]

    def add_operator_connection(
        self, operatorId: uuid.UUID, websocket: WebSocket
    ) -> None:
        """Add an operator connection to the pool.

        Args:
            operatorId: The unique identifier of the operator.
            websocket: The WebSocket connection for the operator.
        """
        logger.info(f"operator {operatorId} added to pool.")
        self._operatorConnectionPool[operatorId] = (True, websocket)

    def remove_operator_connection(self, operatorId: uuid.UUID) -> None:
        """Remove an operator connection from the pool.

        Args:
            operatorId: The unique identifier of the operator to remove.
        """
        logger.info(f"operator {operatorId} removed from pool.")
        self._operatorConnectionPool.pop(operatorId, None)

    def get_operator_connection(
        self, operatorId: uuid.UUID
    ) -> Tuple[bool, WebSocket] | None:
        """Get an operator connection from the pool.

        Args:
            operatorId: The unique identifier of the operator to retrieve.

        Returns:
            The operator connection tuple (available, websocket) if found,
            None otherwise.
        """
        return self._operatorConnectionPool.get(operatorId)

    def next_available_operator_connection(self) -> WebSocket | None:
        """Get the next available operator connection in round-robin fashion.

        Returns:
            The WebSocket connection of the next available operator, or None
            if no operators are available.
        """
        if not self._operatorConnectionPool:
            return None

        values = list(self._operatorConnectionPool.values())
        index = self._emergencyCounter
        for delta in range(len(values)):
            if values[(index + delta) % len(values)][0]:
                self._emergencyCounter += 1
                return values[(index + delta) % len(values)][1]
        return None

    def has_available_operators(self) -> bool:
        """Check if there are any available operators in the pool.

        Returns:
            True if there are available operators, False otherwise.
        """
        return any(available for available, _ in self._operatorConnectionPool.values())

    def get_operator_count(self) -> int:
        """Get the total number of operators in the pool.

        Returns:
            The number of operators in the pool.
        """
        return len(self._operatorConnectionPool)

    def set_operator_availability(self, id: uuid.UUID, available: bool) -> WebSocket:
        self._operatorConnectionPool[id] = (
            available,
            self._operatorConnectionPool[id][1],
        )

        return self._operatorConnectionPool[id][1]

    async def broadcast(self, message: str):
        """Send a message to all available operators"""

        for operatorTup in self._operatorConnectionPool.values():
            await operatorTup[1].send_text(message)
