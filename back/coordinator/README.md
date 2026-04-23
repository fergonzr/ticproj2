# Coordinator Service

Este paquete implementa un adaptador para el puerto `CoordinatorPort` definido en el núcleo del sistema, utilizando conexiones WebSocket para gestionar la comunicación en tiempo real entre los diferentes actores del sistema de emergencias (ciudadanos, operadores y paramédicos).

El servicio actúa como intermediario central que coordina la asignación de emergencias, notifica cambios de estado y mantiene las conexiones WebSocket activas para todos los participantes involucrados en una emergencia. Implementa un patrón de adaptador que traduce los comandos y eventos del dominio a mensajes WebSocket, y viceversa, asegurando una comunicación eficiente y en tiempo real.

## Funcionalidad Principal

### Gestión de Conexiones WebSocket

- **Conexiones de Ciudadanos**: Para reportar emergencias y recibir actualizaciones.
- **Conexiones de Operadores**: Para recibir emergencias, hacerles triaje el respectivo triaje y pedirle a los paramédicos ser asignados a las emergencias.
- **Conexiones de Paramédicos**: Para confirmar su asignación a las emergencias, notificar la llegada al sitio, y realizar tareas médicas (asignar complejidad, transferir, marcar como resuelta).

### Casos de Uso Implementados

1. **Reportar Emergencias**: Ciudadanos reportan emergencias médicas.
2. **Triaje de Emergencias**: Operadores realizen el triaje a las emergencias entrantes.
3. **Asignación de Paramédicos**: Operadores piden la asignación de paramédicos a emergencias.
4. **Confirmación de asignación de paramédicos:** Los paramédicos, una vez se conectan automáticamente confirman su asignación.
5. **Notificación de Llegada**: Paramédicos notifican su llegada al sitio de emergencia.
6. **Asignación de Complejidad**: Paramédicos asignan el nivel de complejidad de la emergencia.
7. **Transferencia a Centro Médico**: Paramédicos transfieren emergencias a centros médicos.
8. **Marcado como Resuelto**: Paramédicos marcan emergencias como resueltas.
9. **Cierre de Emergencias**: Operadores cierran emergencias resueltas.
10. **Notificaciones en Tiempo Real**: Todos los participantes en la respuesta de una emergencia reciben actualizaciones instantáneas.

### Seguridad

El servicio implementa modelos seguros que protegen la información sensible:

- **SafeEmergency**: Representación segura de emergencias que excluye datos sensibles.
- **SafeParamedic**: Representación segura de paramédicos que no expone contraseñas ni correos electrónicos.
- Todos los eventos WebSocket utilizan estos modelos seguros para garantizar que la información sensible nunca se transmita a través de la red.

## Estructura del Código

```
src/coordinator/
├── main.py              # Adaptador principal y puntos de entrada WebSocket
├── active_emergency_manager.py  # Gestor de emergencias activas
├── operator_connection_pool.py # Pool de conexiones de operadores
└── models.py            # Modelos de comandos, eventos y modelos seguros
```

## Interactuándo con él

Lo siguiente se debe tener en cuenta para escribir un cliente de este servicio.
Llámese cliente a cualquier software que busque utilizar la API de WebSocket proveída por este paquete para el efecto de coordinar una emergencia.
La API consiste en exactamente tres endpoints de este tipo, cada uno para un actor distinto:

- **Ciudadano:** `/api/v1/coordination/citizen`.
- **Operador:** `/api/v1/coordination/operator`.
- **Paramédico:** `/api/v1/coordination/paramedic/{emergencyId}`, donde `{emergencyId}` es el UUID de una emergencia activa.

El primero no require autenticación, pero los otros dos requieren pasar el parámetro de URL `token` con el valor de un token JWT válido para el respectivo usuario.
Ve a la documentación del paquete [sie_auth](../auth/) para saber cómo obtener uno de estos.

Específicamente para conectarse a este último endpoint (del del paramédico) es necesario que se cumplan las siguientes condiciones:

1. La emergencia con el id especificado existe.
2. La emergencia con el id especificado está activa.
3. Se ha hecho un triaje para la emergencia con el id especificado.
4. El token de autenticación es válido y está asociado a un usuario de tipo paramédico.
5. El paramédico obtenido a través del token de autenticación está activo.
6. El paramédico obtenido a través del token de autenticación no está ocupado.
7. La emergencia no se ha asignado a un paramédico distinto a aquel especificado a través del token de autenticación.

Ahora bien, el endpoint del ciudadano y del paramédico siempre se ejecuta en el contexto de una única emergencia, puesto que ambos de estos actores únicamente pueden estar asociados a una emergencia activa al mismo tiempo.
Por el contrario, los operadores pueden manejar múltiples emergencias al mismo tiempo, por lo que todos los comandos que modifican una emergencia de su parte incluyen el Id de la emergencia a modificar.

### Mensajes

Toda la comunicación con este servicio se da a través de mensajes en formato JSON.
En particular, se considera únicamente dos tipos de mensajes: comandos y eventos.
Los comandos son los mensajes que van desde el cliente al coordinador, mientras que los eventos van desde el coordinador hasta el cliente.
Se envía un evento cada vez que el objeto de emergencia sufre una modificación, bien sea por efecto de un comando previamente enviado a través del canal, o por la acción de otro actor relacionado con la emergencia.

Los comandos tienen la siguiente estructura:

```json
{
  "command": "{TYPE}",
  "payload": {PAYLOAD}
}
```

Donde `{TYPE}` es el tipo de comando que se quiere ejecutar.
`{PAYLOAD}` es un objeto con los parámetros del respectivo comando, cuya estructura depende de `{TYPE}`.

Por otra parte, los eventos **exitosos** lucen de la siguiente manera:

```json
{
  "event": "{TYPE}",
  "payload": {
    "id": "d237f908-cb62-4761-8926-8585839667c5",
    "alert": {
      "location": {
        "latitude": -66.4805,
        "longitude": -127.6976
      },
      "generatedOn": "2026-03-23T12:48:01Z",
      "medicalInfo": null
    },
    "assignedTo": {
      "id": "77e22242-8aaf-488d-b4ec-256a43bb67b0",
      "name": "Javier",
      "userRole": "PARAMEDIC"
    },
    "status": "ASSIGNED",
    "triage": {
      "bleeding": true,
      "dizziness": true,
      "blurred_vision": true,
      "unconscious": false,
      "difficulty_breathing": false,
      "fracture": true,
      "chest_pain": true,
      "numbness_limbs": false
    },
    "complexityLevel": null,
    "transferedTo": null,
    "cancelReason": null,
    "timeline": {
      "RECEIVED": "2026-03-23T07:48:01.121499",
      "TRIAGED": "2026-03-23T07:48:38.256743",
      "ASSIGNED": "2026-03-23T07:49:01.777647"
    }
  }
}
```

`{TYPE}` define el tipo de evento que se está notificando.
El `payload` siempre es un objeto de tipo `Emergency` (como se define en el paquete [core](../core)), siempre con los datos correspondientes a la última actualización de la emergencia correspondiente.
Esto facilita el seguimiento del estado de la emergencia para los clientes: en cada evento recibido simplemente se sobrescribe el objeto en su totalidad, sea cual sea el evento en cuestión.

Todos los eventos en general pueden ser transmitidos en los tres endpoints, pero no todos los comandos pueden ser enviados a través de los tres.
Sólo deben ser enviados comandos relevantes para el actor correspondiente en cada uno de los endpoints.
Por ejemplo, tratar de enviar el comando para hacerle triaje a una emergencia dada en el endpoint del ciudadano resultará en un error porque esto es una operación reservada para el operador.

En caso que el cliente envíe un comando inválido, bien sea por errores sintácticos en el mensaje o porque describe una operación inválida para la emergencia seleccionada, se enviará de vuelta un evento tipo `ERROR` con la siguiente estructura:

```json
{
  "event": "ERROR",
  "payload": "{error message}"
}
```

Donde `{error message}` es una string que describe el por qué de la invalidez del comando.
De esa manera, enviar mensajes inválidos a través de cualquier endpoint no termina la conexión. En caso de que sí lo haga, **muy probablemente has encontrado un bug** y deberías reportarlo.

A continuación se describen los comandos para cada uno de los actores, junto con sus efectos y los eventos que disparan.

---

### Ciudadano

#### REPORT_EMERGENCY

**Comando para reportar una emergencia médica.**

**Estructura:**
```json
{
  "command": "REPORT_EMERGENCY",
  "payload": {
    "location": {
      "latitude": -66.4805,
      "longitude": -127.6976
    },
    "generatedOn": "2025-07-18T05:19:42.549Z",
    "medicalInfo": null
  }
}
```

El parámetro es del tipo `Alert`, también definido en `core`, la cual recibe los siguientes parámetros:

**Parámetros:**
- `generatedOn`: La timestamp de cuando esta alerta fue generada, en formato [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) (como string entre comillas) o timestamp UNIX (segundos desde el primero de Enero de 1970, como entero).
- `location`: Coordenadas geográficas de la emergencia (opcional, tipo `Location`)
- `medicalInfo`: Información médica completa del paciente (opcional, tipo `MedicalInfo` con campos: `firstName`, `lastName`, `phone`, `documentType`, `documentNumber`, `age`, `bloodType`, `allergies`, `diseases`, `hasPacemaker`)

**Efectos:**
- Crea una nueva emergencia en el sistema
- Asigna un ID único a la emergencia
- Notifica a los operadores disponibles

**Eventos disparados:**
- `EMERGENCY_RECEIVED`: Cuando la emergencia es registrada exitosamente.

**Ejemplo de uso:**
```json
{
  "command": "REPORT_EMERGENCY",
  "payload": {
    "location": {
      "latitude": 4.0209,
      "longitude": 129.0667
    },
    "generatedOn": 1774279635,
    "medicalInfo": null
  }
}
```

#### SUBSCRIBE

**Nota:** Cuando `medicalInfo` no es `null`, debe ser un objeto `MedicalInfo` con la siguiente estructura:

```json
{
  "firstName": "Nombre del paciente",
  "lastName": "Apellido(s) del paciente",
  "phone": "10-dígitos",
  "documentType": "NATIONAL_ID|PASSPORT|IDENTITY_CARD",
  "documentNumber": "Número de documento",
  "age": "Edad en años como string",
  "bloodType": "O_POSITIVE|O_NEGATIVE|A_POSITIVE|A_NEGATIVE|B_POSITIVE|B_NEGATIVE|AB_POSITIVE|AB_NEGATIVE",
  "allergies": ["Lista de alergias"],
  "diseases": ["Lista de enfermedades"],
  "hasPacemaker": false
}
```

Ejemplo de uso completo con información médica:

```json
{
  "command": "REPORT_EMERGENCY",
  "payload": {
    "location": {
      "latitude": 4.0209,
      "longitude": 129.0667
    },
    "generatedOn": 1774279635,
    "medicalInfo": {
      "firstName": "María",
      "lastName": "García López",
      "phone": "0987654321",
      "documentType": "NATIONAL_ID",
      "documentNumber": "123456789",
      "age": "35",
      "bloodType": "A_POSITIVE",
      "allergies": ["Penicilina", "Aspirina"],
      "diseases": ["Hipertensión"],
      "hasPacemaker": true
    }
  }
}
```

Comando para suscribirse a los eventos de una emergencia activa existente. No modifica la emergencia de ninguna manera.
Tiene el propósito de que los clientes puedan continuar recibiendo notificaciones aún si la conexión que reportó la emergencia se cae.

**Estructura:**
```json
{
  "command": "SUBSCRIBE",
  "payload": "d237f908-cb62-4761-8926-8585839667c5"
}
```

**Parámetros:**
- `payload`: ID de la emergencia a la que suscribirse

**Efectos:**
- El cliente recibe todos los eventos futuros relacionados con esa emergencia

**Eventos recibidos:**
- Inmediatamente después de ejecutar este comando, se envía el evento `USER_GREET_EMERGENCY`, para contextualizar al nuevo miembro del canal respecto al estado de la emergencia.
- En el futuro, todos los eventos relacionados con esa emergencia (`EMERGENCY_TRIAGED`, `EMERGENCY_ASSIGNED`, `EMERGENCY_ARRIVED`, etc.)

**Nota:** Ambos de estos comandos solo se envían una vez al establecer la conexión WebSocket. Después de eso, el cliente recibirá eventos automáticamente sin necesidad de enviar más comandos.

#### CANCEL_EMERGENCY

Comando para cancelar una emergencia reportada por el ciudadano.

**Estructura:**
```json
{
  "command": "CANCEL_EMERGENCY",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "reason": "Ya no necesito ayuda médica"
  }
}
```

**Parámetros:**
- `emergencyId`: ID de la emergencia a cancelar
- `reason`: Motivo de la cancelación (opcional)

**Efectos:**
- Cancela la emergencia en el sistema
- Notifica a todos los participantes que la emergencia ha sido cancelada

**Eventos disparados:**
- `EMERGENCY_CANCELED`: Cuando la emergencia es cancelada exitosamente

**Requisitos:**
- La emergencia debe existir y estar activa
- La emergencia debe estar asociada a este ciudadano
- No puede haber sido asignada a un paramédico

**Ejemplo de uso:**
```json
{
  "command": "CANCEL_EMERGENCY",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "reason": "La emergencia ya se resolvió por sí sola"
  }
}
```

---

### Operador

#### REPORT_EMERGENCY

Comando para reportar una emergencia desde el punto de vista del operador (alternativa al comando del ciudadano).

**Estructura:**
```json
{
  "command": "REPORT_EMERGENCY",
  "payload": {
    "location": {
      "latitude": -66.4805,
      "longitude": -127.6976
    },
    "generatedOn": 1774279635,
    "medicalInfo": null
  }
}
```

**Efectos:**
- Crea una nueva emergencia en el sistema
- Asigna un ID único a la emergencia
- Notifica a los operadores disponibles

**Eventos disparados:**
- `EMERGENCY_RECEIVED`: Cuando la emergencia es registrada exitosamente

#### TRIAGE_EMERGENCY

Comando para asignar un nivel de triaje a una emergencia.

**Estructura:**
```json
{
  "command": "TRIAGE_EMERGENCY",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "triage": {
      "bleeding": true,
      "dizziness": false,
      "blurred_vision": false,
      "unconscious": false,
      "difficulty_breathing": true,
      "fracture": false,
      "chest_pain": true,
      "numbness_limbs": false
    }
  }
}
```

**Parámetros:**
- `emergencyId`: ID de la emergencia a hacerle triaje.
- `triage`: Objeto con los síntomas observados, también definido en `core`.

**Efectos:**
- Asigna un nivel de prioridad a la emergencia
- Cambia el estado de la emergencia a `TRIAGED`
- Habilita la emergencia para ser asignada a paramédicos

**Eventos disparados:**
- `EMERGENCY_TRIAGED`: Cuando el triaje es asignado exitosamente

**Requisitos:**
- La emergencia debe estar en estado `RECEIVED`
- Solo puede ser ejecutado por operadores autenticados

**Ejemplo de uso:**
```json
{
  "command": "TRIAGE_EMERGENCY",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "triage": {
      "bleeding": false,
      "dizziness": true,
      "blurred_vision": true,
      "unconscious": false,
      "difficulty_breathing": false,
      "fracture": false,
      "chest_pain": false,
      "numbness_limbs": false
    }
  }
}
```

#### REQUEST_EMERGENCY_ASSIGNMENT

Comando para pedir la asignación de una emergencia a un paramédico.
Este comando no modifica el estado de la emergencia y por tanto genera ningún evento en la conexión, únicamente sirve para que el sistema notifique a los paramédicos activos, que están conectados a otros servicios (como [paramedic-location-updater](../paramedic-location-updater)).

**Estructura:**
```json
{
  "command": "REQUEST_EMERGENCY_ASSIGNMENT",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "paramedicId": "77e22242-8aaf-488d-b4ec-256a43bb67b0"
  }
}
```

**Parámetros:**
- `emergencyId`: ID de la emergencia a asignar
- `paramedicId`: ID del paramédico a asignar

**Efectos:**
- Notifica al paramédico asignado

**Requisitos:**
- La emergencia debe estar en estado `TRIAGED`
- El paramédico debe estar disponible
- El paramédico no debe estar asignado a otra emergencia
- Solo puede ser ejecutado por operadores autenticados

**Ejemplo de uso:**
```json
{
  "command": "REQUEST_EMERGENCY_ASSIGNMENT",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "paramedicId": "77e22242-8aaf-488d-b4ec-256a43bb67b0"
  }
}
```

#### SUBSCRIBE

Comando para suscribirse a los eventos de una emergencia activa existente. No modifica la emergencia de ninguna manera.
Téngase en cuenta que ahora mismo el sistema considera que sólo un operador puede recibir actualizaciones de una emergencia.
En caso de que un operador ya esté suscrito a una emergencia, ejecutar este comando en la conexión de otro operador en efecto hará una transferencia de esta subscripción.

**Estructura:**
```json
{
  "command": "SUBSCRIBE",
  "payload": "d237f908-cb62-4761-8926-8585839667c5"
}
```

**Parámetros:**
- `payload`: ID de la emergencia a la que suscribirse

**Efectos:**
- El cliente recibe todos los eventos futuros relacionados con esa emergencia
- El operador anterior (si existía) recibe el evento `EMERGENCY_TAKEN` con su ID de emergencia

**Eventos recibidos:**
- Inmediatamente después de ejecutar este comando, se envía el evento `USER_GREET_EMERGENCY`
- En el futuro, todos los eventos relacionados con esa emergencia

#### CLOSE_EMERGENCY

Comando para cerrar una emergencia que ha sido marcada como resuelta.

**Estructura:**
```json
{
  "command": "CLOSE_EMERGENCY",
  "payload": "d237f908-cb62-4761-8926-8585839667c5"
}
```

**Parámetros:**
- `payload`: ID de la emergencia a cerrar

**Efectos:**
- Cierra la emergencia en el sistema
- Marca el estado como `CLOSED`

**Eventos disparados:**
- `EMERGENCY_CLOSED`: Cuando la emergencia es cerrada exitosamente

**Requisitos:**
- La emergencia debe estar en estado `RESOLVED`
- Solo puede ser ejecutado por operadores autenticados

**Ejemplo de uso:**
```json
{
  "command": "CLOSE_EMERGENCY",
  "payload": "d237f908-cb62-4761-8926-8585839667c5"
}
```

#### CANCEL_EMERGENCY

Comando para cancelar cualquier emergencia (no necesariamente reportada por el operador).

**Estructura:**
```json
{
  "command": "CANCEL_EMERGENCY",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "reason": "Reporte falso o duplicado"
  }
}
```

**Parámetros:**
- `emergencyId`: ID de la emergencia a cancelar
- `reason`: Motivo de la cancelación (obligatorio)

**Efectos:**
- Cancela la emergencia en el sistema
- Notifica a todos los participantes que la emergencia ha sido cancelada

**Eventos disparados:**
- `EMERGENCY_CANCELED`: Cuando la emergencia es cancelada exitosamente

**Requisitos:**
- La emergencia debe existir y estar activa
- Solo puede ser ejecutado por operadores autenticados

**Ejemplo de uso:**
```json
{
  "command": "CANCEL_EMERGENCY",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "reason": "Emergencia duplicada reportada por ciudadano"
  }
}
```

#### EDIT_ALERT

Comando para editar la información de alerta de una emergencia (ubicación, información médica, timestamp).

**Estructura:**
```json
{
  "command": "EDIT_ALERT",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "location": {
      "latitude": 4.0209,
      "longitude": 129.0667
    },
    "medicalInfo": {
      "firstName": "Juan",
      "lastName": "Pérez",
      "phone": "0987654321",
      "documentType": "PASSPORT",
      "documentNumber": "AB123456",
      "age": "46",
      "bloodType": "A_POSITIVE",
      "allergies": [],
      "diseases": ["Diabetes"],
      "hasPacemaker": false
    }
  }
}
```

**Parámetros:**
- `emergencyId`: ID de la emergencia a editar
- `location`: Nueva ubicación (opcional, tipo `Location`)
- `medicalInfo`: Nueva información médica (opcional, tipo `MedicalInfo` con campos: `firstName`, `lastName`, `phone`, `documentType`, `documentNumber`, `age`, `bloodType`, `allergies`, `diseases`, `hasPacemaker`)

**Efectos:**
- Actualiza la información de alerta de la emergencia

**Eventos disparados:**
- `ALERT_EDITED`: Cuando la alerta es editada exitosamente

**Requisitos:**
- La emergencia debe estar activa
- Solo puede ser ejecutado por operadores autenticados

**Ejemplo de uso:**
```json
{
  "command": "EDIT_ALERT",
  "payload": {
    "emergencyId": "d237f908-cb62-4761-8926-8585839667c5",
    "location": {
      "latitude": 4.0215,
      "longitude": 129.0670
    },
    "medicalInfo": {
      "firstName": "Juan",
      "lastName": "Pérez",
      "phone": "1234567890",
      "documentType": "NATIONAL_ID",
      "documentNumber": "123456789",
      "age": "45",
      "bloodType": "O_POSITIVE",
      "allergies": ["Penicilina"],
      "diseases": ["Hipertensión"],
      "hasPacemaker": false
    }
  }
}
```

#### DEPRECATED: SET_AVAILABILITY

> **⚠️ DEPRECATED**: Este comando ya no tiene efecto y será eliminado en una versión futura.
>
> El nuevo modelo adoptado contempla que son los operadores quienes se asignan emergencias a sí mismos, por lo que modificar su disponibilidad no tiene mucho sentido.

---

### Paramédico

Nótese que, al establecer la comunicación con el endpoint exitosamente, el sistema asigna la emergencia al paramédico que abrió la conexión de manera automática y dispara el evento `EMERGENCY_ASSIGNED` para notificar esta actualización.
Por tanto, el primer mensaje en esta comunicación siempre es un evento de este tipo enviado desde el coordinador hasta el cliente, en contraste con los otros dos endpoints, donde el primer mensaje siempre es un comando enviado por el cliente (a exceptión de los eventos `USER_GREET`).

#### ANNOUNCE_ARRIVAL

Comando para notificar la llegada al sitio de la emergencia.

**Estructura:**
```json
{
  "command": "ANNOUNCE_ARRIVAL",
  "payload": null
}
```

**Parámetros:**
- `payload`: Siempre `null` (el ID de la emergencia se obtiene del contexto de la conexión).

**Efectos:**
- Cambia el estado de la emergencia a `ON_SITE`
- Registra el momento de llegada en el timeline de la emergencia
- Notifica a todos los participantes (ciudadano, operador) que el paramédico ha llegado

**Eventos disparados:**
- `EMERGENCY_ARRIVED`: Cuando la llegada es registrada exitosamente

**Requisitos:**
- El paramédico debe estar conectado al endpoint correcto (`/api/v1/coordination/paramedic/{emergencyId}`)
- La emergencia debe estar en estado `ASSIGNED`
- El paramédico debe ser el asignado a esa emergencia

**Ejemplo de uso:**
```json
{
  "command": "ANNOUNCE_ARRIVAL",
  "payload": null
}
```

#### ASSIGN_COMPLEXITY_LEVEL

Comando para asignar el nivel de complejidad de la emergencia, lo cual ayuda a determinar el tipo de centro médico al que debe ser transferido.

**Estructura:**
```json
{
  "command": "ASSIGN_COMPLEXITY_LEVEL",
  "payload": 1
}
```

**Parámetros:**
- `payload`: Nivel de complejidad (0=BASIC, 1=INTERMEDIATE, 2=HIGH)

**Efectos:**
- Asigna el nivel de complejidad a la emergencia
- La emergencia queda lista para ser transferida si el nivel lo requiere

**Eventos disparados:**
- `EMERGENCY_COMPLEXITY_ASSIGNED`: Cuando el nivel de complejidad es asignado exitosamente

**Requisitos:**
- El paramédico debe estar conectado al endpoint correcto
- La emergencia debe estar en estado `ASSIGNED` o `ON_SITE`
- El paramédico debe ser el asignado a esa emergencia

**Ejemplo de uso:**
```json
{
  "command": "ASSIGN_COMPLEXITY_LEVEL",
  "payload": 2
}
```

#### TRANSFER_EMERGENCY

Comando para transferir una emergencia a un centro médico.

**Estructura:**
```json
{
  "command": "TRANSFER_EMERGENCY",
  "payload": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Parámetros:**
- `payload`: ID del centro médico al que transferir la emergencia

**Efectos:**
- Transfiere la emergencia al centro médico especificado
- Actualiza el estado de la emergencia a `TRANSFERRED`

**Eventos disparados:**
- `EMERGENCY_TRANSFERRED`: Cuando la transferencia es registrada exitosamente

**Requisitos:**
- El paramédico debe estar conectado al endpoint correcto
- La emergencia debe estar en estado `ON_SITE` o `ASSIGNED`
- El paramédico debe ser el asignado a esa emergencia

**Ejemplo de uso:**
```json
{
  "command": "TRANSFER_EMERGENCY",
  "payload": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

#### MARK_EMERGENCY_RESOLVED

Comando para marcar una emergencia como resuelta.

**Estructura:**
```json
{
  "command": "MARK_EMERGENCY_RESOLVED",
  "payload": null
}
```

**Parámetros:**
- `payload`: Siempre `null`

**Efectos:**
- Cambia el estado de la emergencia a `RESOLVED`
- Notifica al operador que la emergencia puede ser cerrada

**Eventos disparados:**
- `EMERGENCY_RESOLVED`: Cuando la emergencia es marcada como resuelta

**Requisitos:**
- El paramédico debe estar conectado al endpoint correcto
- La emergencia debe estar en estado `ON_SITE`
- El paramédico debe ser el asignado a esa emergencia

**Ejemplo de uso:**
```json
{
  "command": "MARK_EMERGENCY_RESOLVED",
  "payload": null
}
```

#### CANCEL_ASSIGNMENT

Comando para cancelar la asignación actual del paramédico a una emergencia.

**Estructura:**
```json
{
  "command": "CANCEL_ASSIGNMENT",
  "payload": {
    "reason": "No puedo asistir a esta emergencia"
  }
}
```

**Parámetros:**
- `reason`: Motivo de la cancelación de la asignación

**Efectos:**
- Cancela la asignación del paramédico a la emergencia
- La emergencia vuelve al estado `TRIAGED` y está disponible para nueva asignación
- Notifica al operador que debe reasignar la emergencia

**Eventos disparados:**
- `EMERGENCY_ASSIGNMENT_CANCELED`: Cuando la asignación es cancelada exitosamente

**Requisitos:**
- El paramédico debe estar conectado al endpoint correcto
- La emergencia debe estar en estado `ASSIGNED`
- El paramédico debe ser el asignado a esa emergencia

**Ejemplo de uso:**
```json
{
  "command": "CANCEL_ASSIGNMENT",
  "payload": {
    "reason": "Me encuentro a demasiada distancia del sitio"
  }
}
```

---

### Resumen Completo de Comandos

| Actor | Comando | Descripción | Eventos Disparados |
|-------|---------|-------------|-------------------|
| **Ciudadano** | `REPORT_EMERGENCY` | Reportar una emergencia | `EMERGENCY_RECEIVED` |
| **Ciudadano** | `SUBSCRIBE` | Suscribirse a una emergencia existente | `USER_GREET_EMERGENCY` |
| **Ciudadano** | `CANCEL_EMERGENCY` | Cancelar propia emergencia | `EMERGENCY_CANCELED` |
| **Operador** | `REPORT_EMERGENCY` | Reportar una emergencia (desde operador) | `EMERGENCY_RECEIVED` |
| **Operador** | `TRIAGE_EMERGENCY` | Realizar triaje de emergencia | `EMERGENCY_TRIAGED` |
| **Operador** | `REQUEST_EMERGENCY_ASSIGNMENT` | Solicitar asignación de paramédico | (ninguno en conexión) |
| **Operador** | `SUBSCRIBE` | Suscribirse a una emergencia | `USER_GREET_EMERGENCY`, `EMERGENCY_TAKEN` (anterior) |
| **Operador** | `CLOSE_EMERGENCY` | Cerrar emergencia resuelta | `EMERGENCY_CLOSED` |
| **Operador** | `CANCEL_EMERGENCY` | Cancelar cualquier emergencia | `EMERGENCY_CANCELED` |
| **Operador** | `EDIT_ALERT` | Editar información de alerta | `ALERT_EDITED` |
| **Paramédico** | `ANNOUNCE_ARRIVAL` | Notificar llegada al sitio | `EMERGENCY_ARRIVED` |
| **Paramédico** | `ASSIGN_COMPLEXITY_LEVEL` | Asignar nivel de complejidad | `EMERGENCY_COMPLEXITY_ASSIGNED` |
| **Paramédico** | `TRANSFER_EMERGENCY` | Transferir a centro médico | `EMERGENCY_TRANSFERRED` |
| **Paramédico** | `MARK_EMERGENCY_RESOLVED` | Marcar como resuelta | `EMERGENCY_RESOLVED` |
| **Paramédico** | `CANCEL_ASSIGNMENT` | Cancelar asignación actual | `EMERGENCY_ASSIGNMENT_CANCELED` |

---

### Resumen Completo de Eventos

| Evento | Descripción | Trigger |
|--------|-------------|---------|
| `USER_GREET` | Saludo inicial al sistema | Nueva conexión |
| `USER_GREET_EMERGENCY` | Saludo con contexto de emergencia | Comando `SUBSCRIBE` |
| `EMERGENCY_TAKEN` | Otro operador tomó la emergencia | Transferencia de subscripción |
| `EMERGENCY_RECEIVED` | Emergencia creada | `REPORT_EMERGENCY` |
| `EMERGENCY_TRIAGED` | Triage completado | `TRIAGE_EMERGENCY` |
| `EMERGENCY_ASSIGNED` | Paramédico asignado | `REQUEST_EMERGENCY_ASSIGNMENT` |
| `EMERGENCY_ARRIVED` | Paramédico llegó al sitio | `ANNOUNCE_ARRIVAL` |
| `EMERGENCY_COMPLEXITY_ASSIGNED` | Nivel de complejidad asignado | `ASSIGN_COMPLEXITY_LEVEL` |
| `EMERGENCY_TRANSFERRED` | Transferido a centro médico | `TRANSFER_EMERGENCY` |
| `EMERGENCY_RESOLVED` | Emergencia marcada como resuelta | `MARK_EMERGENCY_RESOLVED` |
| `EMERGENCY_CLOSED` | Emergencia cerrada | `CLOSE_EMERGENCY` |
| `ALERT_EDITED` | Alerta editada | `EDIT_ALERT` |
| `EMERGENCY_CANCELED` | Emergencia cancelada | `CANCEL_EMERGENCY` |
| `EMERGENCY_ASSIGNMENT_CANCELED` | Asignación cancelada | `CANCEL_ASSIGNMENT` |
| `ERROR` | Error en comando | Comando inválido |

> \[1\]: Sustrayendo los campos sensibles o redundantes del paramédico asociado.
