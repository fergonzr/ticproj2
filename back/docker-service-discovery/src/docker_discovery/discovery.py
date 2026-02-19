import logging
from pathlib import Path

import yaml
from core.application.ports import Service, ServiceDiscoveryPort

# Set up logger for this module
logger = logging.getLogger(__name__)

# Resolve the default compose file path relative to this module's location
CURRENT_MODULE_DIR = Path(__file__).parent
DEFAULT_COMPOSE_FILE = (
    CURRENT_MODULE_DIR.parent.parent.parent.parent / "docker-compose.yaml"
)


class DockerServiceDiscoveryAdapter(ServiceDiscoveryPort):
    composeFile: str
    services: dict

    def __init__(self, compose_file: str = str(DEFAULT_COMPOSE_FILE)) -> None:
        self.composeFile = compose_file
        self.services = self._parse_compose_file()

    def _parse_compose_file(self) -> dict:
        with open(self.composeFile, "r") as file:
            compose_data = yaml.safe_load(file)
            if compose_data and "services" in compose_data:
                return compose_data["services"]
            raise FileNotFoundError(self.composeFile)

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
