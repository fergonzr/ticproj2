# Coordinator Service

Este paquete implementa un adaptador para el puerto `CoordinatorPort` definido en el núcleo del sistema, utilizando conexiones WebSocket para gestionar la comunicación en tiempo real entre los diferentes actores del sistema de emergencias (ciudadanos, operadores y paramédicos).

El servicio actúa como intermediario central que coordina la asignación de emergencias, notifica cambios de estado y mantiene las conexiones WebSocket activas para todos los participantes involucrados en una emergencia. Implementa un patrón de adaptador que traduce los comandos y eventos del dominio a mensajes WebSocket, y viceversa, asegurando una comunicación eficiente y en tiempo real.

## Funcionalidad Principal

### Gestión de Conexiones WebSocket

- **Conexiones de Ciudadanos**: Para reportar emergencias y recibir actualizaciones.
- **Conexiones de Operadores**: Para recibir emergencias, hacerles triaje el respectivo triaje y pedirle a los paramédicos ser asignados a las emergencias.
- **Conexiones de Paramédicos**: Para confirmar su asignación a las emergencias y notificar la llegada al sitio.

### Casos de Uso Implementados

1. **Reportar Emergencias**: Ciudadanos reportan emergencias médicas.
2. **Triaje de Emergencias**: Operadores realizen el triaje a las emergencias entrantes.
3. **Asignación de Paramédicos**: Operadores piden la asignación de paramédicos a emergencias.
4. **Confirmación de asignación de paramédicos:** Los paramédicos, una vez se conectan automáticamente confirman su asignación.
4. **Notificación de Llegada**: Paramédicos notifican su llegada al sitio de emergencia.
5. **Notificaciones en Tiempo Real**: Todos los participantes en la respuesta de una emergencia reciben actualizaciones instantáneas.

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
	// Siempre tiene la emergencia en su última actualización
	"payload": {
		"id": "d237f908-cb62-4761-8926-8585839667c5",
		"alert": {
  		// nullable
			"location": {
				"latitude": -66.4805,
				"longitude": -127.6976
			},
			"generatedOn": "2026-03-23T12:48:01Z",
			"medicalInfo": null
		},
		// nullable
		"assignedTo": {
			"id": "77e22242-8aaf-488d-b4ec-256a43bb67b0",
			"name": "Javier",
			"userRole": "PARAMEDIC"
		},
		"status": "ASSIGNED",
		// nullable
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
		"timeline": {
			"RECEIVED": "2026-03-23T07:48:01.121499",
			"TRIAGED": "2026-03-23T07:48:38.256743",
			"ASSIGNED": "2026-03-23T07:49:01.777647"
		}
	}
}
```


De nuevo, `{TYPE}` define el tipo de evento que se está notificando.
Sin embargo, `payload` en este caso siempre es un objeto de tipo `Emergency` como se define en el paquete [core](../core) \[1\], siempre con los datos correspondientes a la última actualización de la emergencia correspondiente.
Esto facilita el seguimiento del estado de la emergencia para los clientes: en cada evento recibido simplemente se sobrescribe el objeto en su totalidad, sea cual sea el evento en cuestión.

Todos los eventos en general pueden ser transmitidos en los tres endpoints, pero no todos los comandos puden ser enviados a través de los tres.
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
    "medicalInfo": null
    "genratedOn": "2025-07-18T05:19:42.549Z"
  }
}
```

En este caso, el parámetro es del tipo `Alert`, también definido en `core`, la cual recibe los siguientes parámetros:

**Parámetros:**
- `generatedOn`: La timestamp de cuando esta alerta fue generada, bien sea en formato [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) (en cuyo caso pasarla entre comillas, para interpretarse como string), o timestamp UNIX (segundos desde el primero de Enero de 1970, como un entero, no como string).
- `location`: Coordenadas geográficas de la emergencia (opcional)
- `medicalInfo`: Información médica adicional (opcional)

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
- Inmediatamente después de ejecutar este comando, se envía el evento `USER_GREET`, para contextualizar al nuevo miembro del canal respecto al estado de la emergencia.
- En el futuro, todos los eventos relacionados con esa emergencia (`EMERGENCY_TRIAGED`, `EMERGENCY_ASSIGNED`, `EMERGENCY_ARRIVED`, etc.)

**Nota:** Ambos de estos comandos solo se envían una vez al establecer la conexión WebSocket. Después de eso, el cliente recibirá eventos automáticamente sin necesidad de enviar más comandos.

### Operador

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

#### SET_AVAILABILITY

Comando para cambiar el estado de disponibilidad del operador.
Este comando tampoco modifica la emergencia ni dispara ningún evento.
Su propósito es modificar el estado de disponibilidad del operador actual.
Al estar disponible, el sistema puede asignar automáticamente nuevas emergencias al operador.
En caso de no estarlo, las emergencias que se reporten irán a otros operadores.

**Estructura:**
```json
{
  "command": "SET_AVAILABILITY",
  "payload": true
}
```

**Parámetros:**
- `payload`: Boolean que indica disponibilidad (`true` = disponible, `false` = no disponible)

**Efectos:**
- Cuando el operador se marca como disponible, recibe emergencias pendientes
- Cuando se marca como no disponible, deja de recibir nuevas emergencias

**Eventos recibidos:**
- `EMERGENCY_RECEIVED`: Cuando se asigna una nueva emergencia al operador

**Ejemplo de uso:**
```json
{
  "command": "SET_AVAILABILITY",
  "payload": true
}
```

#### SUBSCRIBE

Al igual que para un ciudadano, un operador puede ejecutar el comando `SUBSCRIBE`, con la misma sintaxis, para que futuras actualizaciones del estado de una emergencia en particular sean notificados a él.
Téngase en cuenta que ahora mismo el sistema considera que sólo un operador puede recibir actualizaciones de una emergencia.
En caso de que un operador ya esté suscrito a una emergencia, ejecutar este comando en la conexión de otro operador en efecto hará una transferencia de esta subscripción.

### Paramédico

Nótese que, al establecer la comunicación con el endpoint exitosamente, el sistema asigna la emergencia al paramédico que abrió la conexión de manera automática y dispara el evento `ASSIGNED` para notificar esta actualización.
Por tanto, el primer mensaje en esta comunicación siempre es un evento de este tipo enviado desde el coordinador hasta el cliente, en contraste con los otros dos endpoints, donde el primer mensaje siempre es un comando enviado por el cliente.

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

> \[1\]: Sustrayendo los campos sensibles o redundantes del paramédico asociado.
