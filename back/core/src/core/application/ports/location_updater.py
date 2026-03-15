import uuid

from core.application.ports.port import Port
from core.domain.entities.emergency import Emergency


class ParamedicLocationUpdaterPort(Port):
    """A port to communicate with the ParamedicLocationUpdater
    service. It should be used mainly to send request to a specific
    active paramedic from other services."""

    async def request_emergency_assignment(
        self, paramedicId: uuid.UUID, emergency: Emergency, confirmationURL: str
    ):
        """Request a paramedic to be assigned an emergency

        Args:
            paramedicId: The id of the paramedic to assign this
            emergency to.
            emergency: The emergency to assign to the paramedic.
            connectToURL: The URL that a the paramedic must go to in
            order to confirm the assignment.
        """

    raise NotImplementedError
