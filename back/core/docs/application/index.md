# Application Layer Overview

The application layer serves as the intermediary between the domain layer (containing core business logic) and the outside world. It defines the application's use cases, coordinates operations between domain entities and external services, and provides interfaces (ports) for interacting with external systems.

Every service should define adapters, which implement ports given by this layer, handling the technology-specific details by themselves.

## Key Responsibilities

1. **Use Case Implementation**: Defines application-specific operations like reporting emergencies through command patterns.
2. **Port Definition**: Creates interfaces (ports) that define how the application interacts with external services.
3. **Dependency Management**: Configures dependency injection containers and factories for creating service adapters.
4. **Workflow Coordination**: Orchestrates the flow between domain entities and external systems.
5. **CQRS Integration**: Sets up command handling infrastructure using the CQRS pattern.

## Architecture Components

- **Use Cases**: Application operations that coordinate between domain and infrastructure
- **Ports**: Interfaces that abstract external service interactions
- **Factories**: Components that create and configure dependencies
- **Handlers**: Implementations that process commands and coordinate operations

The application layer focuses on "what" the application does rather than "how" it's implemented, maintaining a clear separation from both the domain logic and the technical implementations.

## More details

- [Factories](factories.md)
- [Use Cases](use_cases.md)
- [Ports](ports.md)
