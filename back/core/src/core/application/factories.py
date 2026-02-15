"""Factories module for creating and configuring application components.

This module provides factories for creating adapters, mediators, and other
components useful when writing services for the system
"""

from typing import Callable, get_type_hints

import cqrs
from cqrs import RequestMediator
from cqrs.container.dependency_injector import DependencyInjectorCQRSContainer
from cqrs.requests import bootstrap
from dependency_injector import containers, providers

from core.application.ports import Port, Service, ServiceDiscoveryPort
from core.application.ports.realtime_storage import RealTimeStoragePort
from core.application.use_cases.report_emergency import (
    ReportEmergencyCommand,
    ReportEmergencyHandler,
)


class ServiceAdapterFactory:
    """A factory to generate any number of Adapters given a ServiceDiscovery implementation.

    This factory creates adapter instances by resolving their required services through
    a ServiceDiscoveryPort implementation. Each adapter is instantiated with the
    services it requires to function.

    Attributes:
        _serviceDiscoverer: The service discovery port used to retrieve required services.
    """

    _serviceDiscoverer: ServiceDiscoveryPort

    def __init__(self, discoverer: ServiceDiscoveryPort) -> None:
        """Initializes the ServiceAdapterFactory with a service discoverer.

        Args:
            discoverer: The ServiceDiscoveryPort implementation to use for retrieving services.
        """
        self._serviceDiscoverer = discoverer

    def create_adpater(self, port: type[Port]) -> Port:
        """Creates an adapter instance for the given port type.

        This method retrieves all required services for the port and instantiates
        the adapter with those services.

        Args:
            port: The port type/class to create an adapter for.

        Returns:
            An instance of the adapter for the given port type.
        """
        services: dict[str, Service] = {}
        for service in port.requiredServices:
            services[service] = self._serviceDiscoverer.get_service(service)

        return port(**services)


def _generate_command_mapper(
    useCases: list[tuple[type[cqrs.Request], type[cqrs.RequestHandler]]],
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
            mapper.bind(*useCase)

    return bindAll


def create_mediator(
    adapterFactory: ServiceAdapterFactory,
    ports: list[type[Port]],
    useCases: list[tuple[type[cqrs.Request], type[cqrs.RequestHandler]]],
) -> RequestMediator:
    """Creates a CQRS mediator with the given configuration.

    This function sets up a dependency injection container, registers all ports
    and use cases, and creates a configured mediator for handling CQRS commands.
    It is the responsability of the caller to ensure that all of the
    adapters required by all of the use cases requested are registered.

    Args:
        adapterFactory: The factory to use for creating adapters.
        ports: A list of port types to register in the container.
        useCases: A list of tuples containing request and handler types
                  for each use case that the service is to use.

    Returns:
        A configured RequestMediator instance ready to handle commands.
    """
    container = containers.DynamicContainer()

    # Register the adapters in the containers by the name of the
    # port it implements
    for port in ports:
        setattr(
            container,
            port.__bases__[0].__name__,
            providers.Singleton(adapterFactory.create_adpater, port=port),
        )

    # Register the handlers for all of the use cases with a bit of
    # inpection magic
    for useCase in useCases:
        provider = providers.Factory(
            useCase[1],
            **{
                paramName: getattr(container, portType.__name__)
                for paramName, portType in get_type_hints(useCase[1].__init__).items()
                if paramName != "return"
            },
        )
        setattr(container, useCase[1].__name__, provider)

    # Take that dependency injection container and wrap it around a CQRS container
    cqrs_container = DependencyInjectorCQRSContainer()
    cqrs_container.attach_external_container(container)

    # Bootstrap the mediator
    return bootstrap.bootstrap(
        di_container=cqrs_container, commands_mapper=_generate_command_mapper(useCases)
    )
