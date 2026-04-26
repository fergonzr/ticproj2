# Servicio de Actualización de Ubicación de Paramédicos

## Funcionalidad Principal

Este servicio proporciona una API WebSocket para que los paramédicos envíen actualizaciones en tiempo real de su ubicación y para que los operadores reciban estas actualizaciones mediante un modelo de publicación/suscripción.

### Gestión de Conexiones WebSocket

El servicio gestiona conexiones WebSocket para:
- Paramédicos: Envían actualizaciones de su ubicación.
- Operadores: Se suscriben para recibir actualizaciones de ubicación.

### Casos de Uso Implementados

1. **Actualización de Ubicación de Paramédicos**: Los paramédicos pueden enviar su ubicación actual al servidor.
2. **Suscripción de Operadores**: Los operadores pueden suscribirse para recibir actualizaciones de ubicación de los paramédicos.
3. **Cancelación de Suscripción**: Los operadores pueden cancelar su suscripción para dejar de recibir actualizaciones.

### Seguridad

El servicio garantiza una comunicación segura a través de conexiones WebSocket, con mecanismos de autenticación y autorización para validar a los paramédicos y operadores. La autenticación se realiza mediante tokens JWT (JSON Web Tokens), los cuales pueden ser obtenidos a través de la API de autenticación definida en el paquete [auth](../auth). Consulta la [documentación del paquete auth](../auth/README.md) para obtener más detalles sobre cómo obtener y utilizar estos tokens.

## Endpoints WebSocket

El servicio expone dos endpoints WebSocket para la gestión de ubicaciones de paramédicos:

### `/api/v1/locationTracker`

**Propósito**: Este endpoint está diseñado para que los paramédicos se conecten y envíen actualizaciones de su ubicación en tiempo real.

**Autenticación**: Requiere un token JWT válido con el rol `PARAMEDIC`. El token debe proporcionarse como parámetro de consulta `token`.

**Mensajes Aceptados**:
- `UPDATE_LOCATION`: Permite a un paramédico enviar su ubicación actual.

**Eventos Emitidos**:
- `ASSIGNMENT_REQUESTED`: Notifica al paramédico cuando se le asigna una emergencia.
- `ERROR`: Indica errores durante el procesamiento.

### `/api/v1/locationTracker/watch`

**Propósito**: Este endpoint está diseñado para que los operadores se conecten y reciban actualizaciones de ubicación de los paramédicos a los que están suscritos.

**Autenticación**: Requiere un token JWT válido con el rol `OPERATOR`. El token debe proporcionarse como parámetro de consulta `token`.

**Mensajes Aceptados**:
- `SUBSCRIBE`: Permite a un operador suscribirse a las actualizaciones de ubicación de un paramédico específico.
- `UNSUBSCRIBE`: Permite a un operador cancelar la suscripción a las actualizaciones de ubicación de un paramédico específico.

**Eventos Emitidos**:
- `LOCATION_UPDATED`: Notifica al operador cuando un paramédico suscripto actualiza su ubicación.
- `ERROR`: Indica errores durante el procesamiento, como comandos inválidos o suscripciones no registradas.

## Estructura del Código

El código está organizado en los siguientes módulos:
- `server`: Implementación del servidor WebSocket.
- `models`: Modelos de datos para las actualizaciones de ubicación y suscripciones.

## Interactuando con el API

### Mensajes

#### Commands

##### SUBSCRIBE

**Descripción**: Este comando permite a un operador suscribirse para recibir actualizaciones de ubicación de los paramédicos. El `payload` debe ser un UUID que identifica al paramédico cuya ubicación se quiere rastrear.

**Comando:**
```json
{
  "command": "SUBSCRIBE",
  "payload": "123e4567-e89b-12d3-a456-426614174000"
}
```

##### UNSUBSCRIBE

**Descripción**: Este comando permite a un operador cancelar su suscripción para dejar de recibir actualizaciones de ubicación. El `payload` debe ser un UUID que identifica al paramédico cuya ubicación se quiere dejar de rastrear..

**Comando:**
```json
{
  "command": "UNSUBSCRIBE",
  "payload": "123e4567-e89b-12d3-a456-426614174000"
}
```

##### UPDATE_LOCATION

**Descripción**: Este comando permite a un paramédico enviar su ubicación actual al servidor. El `payload` debe incluir la latitud y longitud de la ubicación del paramédico.

**Comando:**
```json
{
  "command": "UPDATE_LOCATION",
  "payload": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### Eventos

##### ASSIGNMENT_REQUESTED

**Descripción**: Este evento se emite a un paramédico cuando se solicita la asignación de una emergencia. El `payload` contiene información detallada sobre la emergencia, incluyendo la ubicación, información médica, y el estado de la emergencia.

**Evento:**
```json
{
  "event": "ASSIGNMENT_REQUESTED",
  "payload": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "alert": {
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "generatedOn": "2023-10-01T12:00:00Z",
      "medicalInfo": null
    },
    "assignedTo": null,
    "status": "TRIAGED",
    "triage": {
      "bleeding": false,
      "dizziness": false,
      "blurred_vision": false,
      "unconscious": false,
      "difficulty_breathing": false,
      "fracture": false,
      "chest_pain": false,
      "numbness_limbs": false
    },
    "complexityLevel": 1,
    "transferedTo": null,
    "cancelReason": null,
    "timeline": {
      "RECEIVED": "2023-10-01T12:00:00Z",
      "TRIAGED": "2023-10-01T12:05:00Z",
    }
  }
}
```

##### LOCATION_UPDATED

**Descripción**: Este evento se emite cuando un paramédico actualiza su ubicación, a los operadores suscritos a las actualizaciones de ubicación de este paramédico. El `payload` contiene el ID del paramédico y su nueva ubicación.

**Evento:**
```json
{
  "event": "LOCATION_UPDATED",
  "payload": {
    "paramedicId": "123e4567-e89b-12d3-a456-426614174000",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

##### ERROR

**Descripción**: Este evento se emite cuando ocurre un error en el procesamiento. El `payload` contiene un mensaje de error descriptivo.

**Evento:**
```json
{
  "event": "ERROR",
  "payload": "Mensaje de error"
}
```

### Resumen Completo de Comandos

| Comando | Descripción |
|---------|-------------|
| SUBSCRIBE | Operador se suscribe para recibir actualizaciones de ubicación. |
| UNSUBSCRIBE | Operador cancela la suscripción para dejar de recibir actualizaciones. |
| UPDATE_LOCATION | Paramédico envía su ubicación actual. |

### Resumen Completo de Eventos

| Evento | Descripción |
|--------|-------------|
| ASSIGNMENT_REQUESTED | Se solicita la asignación de una emergencia. |
| LOCATION_UPDATED | Se actualiza la ubicación de un paramédico. |
| ERROR | Ocurre un error en el procesamiento. |