"""Operator connection pool module.

This module provides the OperatorConnectionPool class for managing
operator WebSocket connections and distributing emergencies to available operators.
"""

import uuid
from typing import Dict, Tuple

from fastapi import WebSocket


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

    def add_operator_connection(
        self, operatorId: uuid.UUID, websocket: WebSocket
    ) -> None:
        """Add an operator connection to the pool.

        Args:
            operatorId: The unique identifier of the operator.
            websocket: The WebSocket connection for the operator.
        """
        self._operatorConnectionPool[operatorId] = (True, websocket)

    def remove_operator_connection(self, operatorId: uuid.UUID) -> None:
        """Remove an operator connection from the pool.

        Args:
            operatorId: The unique identifier of the operator to remove.
        """
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
