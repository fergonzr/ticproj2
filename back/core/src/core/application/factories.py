"""Factories module for creating and configuring application components.

This module provides factories for creating adapters, mediators, and other
components useful when writing services for the system.
"""

from typing import Callable, get_type_hints

import cqrs
from cqrs import RequestMediator
from cqrs.container.dependency_injector import DependencyInjectorCQRSContainer
from cqrs.requests import bootstrap
from dependency_injector import containers, providers

from core.application.ports import Port, ServiceDiscoveryPort
from core.application.use_cases import DefaultedRequest


def _generate_command_mapper(
    useCases: list[DefaultedRequest],
) -> Callable[[cqrs.RequestMap], None]:
    """Generates a command mapper function for the given use cases.

    This function creates a mapper that binds each use case's request and handler
    to the CQRS request map.

    Args:
        useCases: A list of tuples containing request and handler types for each use case.

    Returns:
        A callable that takes a RequestMap and binds all use cases to it.
    """

    def bindAll(mapper: cqrs.RequestMap):
        """Binds all use cases to the request map.

        Args:
            mapper: The RequestMap to bind use cases to.
        """
        for useCase in useCases:
            mapper.bind(useCase, useCase.defaultHandler)

    return bindAll


def create_mediator(
    serviceDiscovery: ServiceDiscoveryPort,
    useCases: list[DefaultedRequest],
    adapter: Port | None = None,
) -> RequestMediator:
    """Creates a CQRS mediator with the given configuration.

    This function sets up a dependency injection container, registers all ports
    and use cases, and creates a configured mediator for handling CQRS commands.
    It is the responsibility of the caller to ensure that all of the
    adapters required by all of the use cases requested are registered.

    Args:
        serviceDiscovery: The service discovery port used to retrieve
                 required services.
        useCases: A list of DefaultedRequets that the service expects
                 to be handled properly.
        adapter: An adapter that the caller already implements and
                 thus there is no need to look it up through
                 serviceDiscovery.

    Returns:
        A configured RequestMediator instance ready to handle commands.
    """
    container = containers.DynamicContainer()

    # Register the handlers for all of the use cases with a bit of
    # inpection magic
    for useCase in useCases:
        provider = providers.Factory(
            useCase.defaultHandler,
            **{
                paramName: adapter
                if adapter.__class__.__base__ is portType
                else providers.Singleton(
                    serviceDiscovery.build_adapter, port_type=portType
                )
                for paramName, portType in get_type_hints(
                    useCase.defaultHandler.__init__
                ).items()
                if paramName != "return"
            },
        )
        setattr(container, useCase.defaultHandler.__name__, provider)

    # Take that dependency injection container and wrap it around a CQRS container
    cqrs_container = DependencyInjectorCQRSContainer()
    cqrs_container.attach_external_container(container)

    # Bootstrap the mediator
    return bootstrap.bootstrap(
        di_container=cqrs_container, commands_mapper=_generate_command_mapper(useCases)
    )
