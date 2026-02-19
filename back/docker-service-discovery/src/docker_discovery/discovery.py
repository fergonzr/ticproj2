import importlib
import logging
import sys
from pathlib import Path

import yaml
from core.application.ports import Port, Service, ServiceDiscoveryPort
from dragonfly_rtstorage import DragonflyRealTimeStorageAdapter

# Set up logger for this module
logger = logging.getLogger(__name__)

# Resolve the file paths relative to this module's location
CURRENT_MODULE_DIR = Path(__file__).parent
DEFAULT_COMPOSE_FILE = CURRENT_MODULE_DIR.parent.parent.parent / "docker-compose.yaml"
ADAPTER_MAPPINGS_FILE = CURRENT_MODULE_DIR / "adapter-mappings.yaml"


class DockerServiceDiscoveryAdapter(ServiceDiscoveryPort):
    composeFile: str
    services: dict
    _adapterMappings: dict

    def __init__(self, compose_file: str = str(DEFAULT_COMPOSE_FILE)) -> None:
        self.composeFile = compose_file
        self.services = self._parse_compose_file()
        self._adapterMappings = self._parse_adapter_mappings_file()

    def _parse_compose_file(self) -> dict:
        with open(self.composeFile, "r") as file:
            compose_data = yaml.safe_load(file)
            if compose_data and "services" in compose_data:
                return compose_data["services"]
            raise FileNotFoundError(self.composeFile)

    def _parse_adapter_mappings_file(self) -> dict:
        with open(ADAPTER_MAPPINGS_FILE, "r") as file:
            return yaml.safe_load(file)

    def get_service(self, service_name: str) -> Service:
        """Retrieves the configuration for a specific service.

        Args:
            service_name: The name of the service to retrieve.

        Returns:
            The Service configuration for the requested service.

        Raises:
            KeyError: If the service name is not found.
        """
        if service_name not in self.services:
            raise KeyError(f"Service '{service_name}' not found in docker-compose.yaml")

        service_config = self.services[service_name]

        host = service_name

        # Extract the port from which the service is exposed
        # Default to 80 if port is not specified
        port = int(service_config.get("ports", ["80:80"])[0].split(":")[1])

        username = None
        password = None
        try:
            username = [
                service_config["environment"][key]
                for key in service_config["environment"]
                if "USER" in key
            ][0]
            password = [
                service_config["environment"][key]
                for key in service_config["environment"]
                if "PASS" in key
            ][0]
        # Not all services need to configure usernames and passwords,
        # so we have to take into account this exception
        except Exception as e:
            logger.info(
                "Could not populate username or password for service '%s': %s",
                service_name,
                str(e),
            )

        return Service(username=username, password=password, host=host, port=port)

    def build_adapter(self, port_type: type[Port]) -> Port:
        """Builds an adapter that implements the specified port type.

        Args:
            port_type: The port interface that should be implemented.

        Returns:
            The Adapter that implements the given Port interface, with
            its required services already injected.

        Raises:
            KeyError: If the adapter mapping for the port type is not found.
            AdapterUnavailableError: If no suitable adapters have their required
                services running.
        """
        portTypeName: str = port_type.__name__

        # Get the adapter mapping for the given port type
        if portTypeName not in self._adapterMappings:
            raise KeyError(f"Adapter mapping for port type '{portTypeName}' not found")

        adapter_info = self._adapterMappings[portTypeName]

        # Get the adapter class name
        adapter_class_name = adapter_info[0]["adapter"]

        # Get the adapter class from globals
        adapter_class = globals().get(adapter_class_name)
        if adapter_class is None:
            raise KeyError(f"Adapter class '{adapter_class_name}' not found in globals")

        # Get required services directly from the adapter class
        required_services = adapter_class.requiredServices

        # Get service configurations for each required service
        services = {}
        for service_name in required_services:
            services[service_name] = self.get_service(service_name)

        # Instantiate the adapter with the required services
        adapter = adapter_class(**services)
        return adapter
