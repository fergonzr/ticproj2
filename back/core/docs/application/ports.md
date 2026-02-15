# Ports Documentation

## Overview

Ports in the application layer define interfaces that abstract interactions with external systems. They follow the **Ports and Adapters** pattern, allowing the core application logic to remain independent of specific implementations.

## Base Ports

### Service

::: core.application.ports.port.Service

### Port

::: core.application.ports.port.Port

### ServiceDiscoveryPort

::: core.application.ports.port.ServiceDiscoveryPort

## Application Ports

### Coordinator

::: core.application.ports.coordinator.CoordinatorPort

### RealTimeStorage

::: core.application.ports.realtime_storage.RealTimeStoragePort

## Port Implementation Pattern

Ports are designed to be implemented by adapters that connect to specific external systems. The typical implementation pattern is:

1. **Define the Port Interface**: In the application layer (as shown above)
2. **Create an Adapter**: In the infrastructure layer that implements the port
3. **Register the Adapter**: With the dependency injection container
4. **Use the Port**: Through the adapter in use case handlers

### Example Implementation Structure

```python
# Infrastructure layer - Adapter implementation
class MySQLRealTimeStorageAdapter(RealTimeStoragePort):
    def __init__(self, connection_string: str):
        self.connection = create_connection(connection_string)

    async def save_emergency(self, emergency: Emergency):
        # Implementation using MySQL
        await self.connection.execute(
            "INSERT INTO emergencies (id, location, medical_info) VALUES (?, ?, ?)",
            emergency.id, emergency.location, emergency.medicalInfo
        )

# Configuration
adapter_factory = ServiceAdapterFactory(service_discovery)
storage_adapter = adapter_factory.create_adapter(MySQLRealTimeStorageAdapter)

# Usage in handler
class ReportEmergencyHandler:
    def __init__(self, storage: RealTimeStoragePort):
        self.storage = storage

    async def handle(self, command):
        emergency = command.to_domain()
        await self.storage.save_emergency(emergency)
```

## Benefits of Ports and Adapters

1. **Separation of Concerns**: Application logic is decoupled from infrastructure details
2. **Testability**: Easy to create mock implementations for testing
3. **Flexibility**: Can switch implementations without changing application code
4. **Maintainability**: Clear interface contracts make the system easier to understand
5. **Technology Independence**: Application can work with different database systems, APIs, etc.