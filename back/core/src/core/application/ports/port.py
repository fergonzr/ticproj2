"""Ports module for defining application ports and service discovery.

This module contains the base Port class and related interfaces for service discovery
and dependency management in the application.
"""

from typing import TypedDict


class Service(TypedDict):
    """A service configuration containing host and port information.

    This TypedDict defines the structure for service configurations used throughout
    the application to locate and connect to various services.

    Attributes:
        host: The hostname or IP address of the service.
        port: The network port number where the service is available.
    """

    host: str
    port: int


class Port:
    """Base class for all application ports.

    Ports serve as interfaces between the application (this package, core) and external services.
    This base class provides common functionality for managing service configurations.
    Adapters are implementations of Ports and must inherit directly from the port class they're trying to implement.

    Attributes:
        _serviceDirectory: A dictionary mapping service names required by the implementors to their configuration (private).
        requiredServices: A list of service names that this port requires.
    """

    _serviceDirectory: dict[str, Service] = {}
    requiredServices: list[str] = []

    def __init__(self, **kargs: Service) -> None:
        """Initializes the Port with service configurations.

        Args:
            **kargs: Service configurations as keyword arguments where keys are
                service names and values are Service objects.
        """
        self._serviceDirectory.update(kargs)


class ServiceDiscoveryPort(Port):
    """Interface for service discovery functionality.

    Implementations of this port provide the ability to discover and retrieve
    service configurations dynamically at runtime.

    This is an abstract base class that must be implemented by concrete service
    discovery providers.
    """

    def get_service(self, service_name: str) -> Service:
        """Retrieves the configuration for a specific service.

        Args:
            service_name: The name of the service to retrieve.

        Returns:
            The Service configuration for the requested service.

        Raises:
            NotImplementedError: This method must be implemented by subclasses.
            KeyError: If the service name is not found.
        """
        raise NotImplementedError
