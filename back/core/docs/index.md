# Core System Architecture Overview

## Introduction

This package (Core) fulfills two very important purposes within the
hexagonal (AKA clean architecture) microservice-based architecture of
the overall system:

1. Be a centralized location to enforce business rules and invariants.
2. Provide coordination capabilities between the different services of the system.

It accomplishes these through two different architecture layers, respectively:

1. **Domain layer:** The innermost layer that encompasses all of the core business logic.
2. **Application layer:** Coordinates the different services of the application through a CQRS pattern.

This allows all of the services to share all business logic
consistently, without compromising on performance.
Additionally, it makes it so services are only
concerned with implementing their technology-specific functionality,
being guaranteed the services they rely on are actually implemented.

This package is **NOT** a service onto itself. Rather, it provides
logic to be shared across all services of the system through package
importing.

## Inspiration

The overall architecture of the system combines three models of software architecture:

1. **Microservices-based Architecture:** The system is, at its core, a cluster of interdependent microservices, each providing a small part of its overall functionality.
2. **Hexagonal architecture (ports and adapters):** There are no direct dependencies from one service to another: they all provide their own technology-specific *adapters* that communicate with the core (this package) through *ports*, with all of the high-level business logic and coordination already solved for them.
3. **Domain-Driven Design:** A software should be designed, first and foremost, to fulfill its specific role within a domain. As such, its very structure should reflect this domain.
