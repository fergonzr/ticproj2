"""Pytest configuration for async test support.

This module provides pytest configuration and fixtures for supporting
asynchronous tests in the application layer.
"""

import asyncio

import pytest


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test session.

    This fixture is required for pytest-asyncio to work properly with
    async test functions.
    """
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()
