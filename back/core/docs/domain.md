# The domain layer

The domain layer of the application is concerned with mantaining clear business rules across all the services. It operates directly with domain objects, categorized as:

1. **Entities:** That have an identity and lifecycle in the application.
2. **Value Objects:** That lack identity, and serve only as containers of data.

## Entities

### Emergency

::: core.domain.entities.emergency

### Paramedic

::: core.domain.entities.paramedic

## Value Objects

### Location

::: core.domain.value_objects.location

### Medical info

::: core.domain.value_objects.medical_info
