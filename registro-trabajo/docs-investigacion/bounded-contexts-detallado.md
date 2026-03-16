# Bounded Contexts Detallados
## Sistema de Atención de Emergencias (SIE)

---

## Índice

1. [Contexto de Respuesta a Emergencias](#1-contexto-de-respuesta-a-emergencias)
2. [Contexto de Asignación de Paramédico](#2-contexto-de-asignación-de-paramédico)
3. [Contexto de Asignación de Centros Médicos](#3-contexto-de-asignación-de-centros-médicos)
4. [Contexto de Enrutamiento](#4-contexto-de-enrutamiento)
5. [Contexto de Localización del Recurso](#5-contexto-de-localización-del-recurso)
6. [Contexto de Manejo de Usuarios](#6-contexto-de-manejo-de-usuarios)
7. [Contexto de Atención Prehospitalaria](#7-contexto-de-atención-prehospitalaria)
8. [Contexto de Centros Médicos](#8-contexto-de-centros-médicos)
9. [Contexto de Analítica](#9-contexto-de-analítica)
10. [Contexto de Responsabilidad Legal](#10-contexto-de-responsabilidad-legal)
11. [Contexto de Soporte al Usuario](#11-contexto-de-soporte-al-usuario)

---

# 1. Contexto de Respuesta a Emergencias

**Tipo:** `CORE`

## Propósito

Gestionar el ciclo de vida completo de una emergencia médica, desde la recepción de la alerta inicial hasta el cierre formal del caso. Es el contexto central del sistema y el punto de entrada de toda operación de atención.

## Responsabilidades

- Recibir y registrar alertas de emergencia provenientes de ciudadanos.
- Crear y gestionar el caso de emergencia con toda su información asociada.
- Coordinar la clasificación inicial por triaje y el seguimiento del estado hasta su resolución.
- Mantener la línea de tiempo cronológica de eventos del caso.
- Emitir eventos hacia otros contextos ante cambios críticos de estado.

## Alcance del Dominio

**Dentro del contexto:**
- Creación del caso de emergencia y asignación del número de radicado.
- Clasificación inicial de severidad (triaje) realizada por el operador.
- Gestión del estado del ciclo de vida del caso.
- Registro de la línea de tiempo de eventos.

**Fuera del contexto:**
- Asignación de paramédicos y centros médicos (contextos especializados).
- Atención clínica en campo (Contexto de Atención Prehospitalaria).
- Cálculo de rutas (Contexto de Enrutamiento).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Caso de Emergencia | Instancia completa de una emergencia desde el reporte inicial hasta el cierre formal del caso. |
| Alerta | Notificación inicial recibida por el sistema que activa el proceso de atención de emergencia. |
| Triaje | Evaluación y clasificación de la severidad del paciente realizada por el operador al momento de recibir la alerta. |
| Nivel de Prioridad | Nivel de urgencia asignado al caso: `CRITICO` (rojo), `URGENTE` (amarillo), `NO_URGENTE` (verde). |
| Estado de Emergencia | Enumeración que representa la etapa actual en el ciclo de vida de un `CasoDeEmergencia`. Determina qué acciones son válidas sobre el caso y refleja qué eventos han ocurrido. Las transiciones de estado siguen un orden definido y están controladas exclusivamente por este contexto. Valores posibles: `RECIBIDO` → `EN_ESPERA_DE_ASIGNACION` → `ASIGNADO` → `ATENDIDO_EN_SITIO` → `EN_TRASLADO` → `CERRADO`. En cualquier punto anterior al despacho puede transicionar a `CANCELADO`. |
| Línea de Tiempo | Registro cronológico de todos los eventos y cambios de estado ocurridos en el caso. |
| Número de Radicado | Identificador único asignado al caso de emergencia para su trazabilidad. |
| Información Médica | Datos básicos de salud del ciudadano reportante relevantes para la atención inicial. |
| `RECIBIDO` | El sistema ha registrado la alerta inicial y creado el caso de emergencia. El operador aún no ha completado el triaje ni iniciado la asignación de recursos. |
| `EN_ESPERA_DE_ASIGNACION` | El triaje ha sido realizado y el caso está en cola para que se le asigne un paramédico disponible. No hay paramédico vinculado aún. |
| `ASIGNADO` | Un paramédico ha sido formalmente asignado al caso y ha confirmado la aceptación. Se encuentra en tránsito hacia el lugar del incidente. |
| `ATENDIDO_EN_SITIO` | El paramédico llegó al lugar del incidente y está brindando atención prehospitalaria al paciente. Aún no se ha determinado si requiere traslado. |
| `EN_TRASLADO` | Se ha asignado un centro médico de destino y el paciente está siendo transportado activamente hacia él. |
| `CERRADO` | El caso ha concluido formalmente: el paciente fue entregado al centro médico o la situación fue resuelta en sitio. No se permiten más modificaciones. |
| `CANCELADO` | El caso fue cancelado antes del despacho del paramédico (ej. falsa alarma, ciudadano no localizado, error de reporte). No se permiten más modificaciones. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `Triaje` | Clasificación de severidad del paciente realizada por el operador. Tiene identidad propia ya que puede ser actualizado por re-triaje. |
| `Alerta` | Datos de la notificación inicial: localización, hora de creación y datos del ciudadano. Es el disparador del caso y existe dentro del agregado. |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `NumeroDeRadicado` | Número único asignado al caso de emergencia para su identificación. Inmutable una vez asignado. |
| `Localizacion` | Coordenadas geográficas (latitud/longitud) y dirección textual del lugar del incidente. |
| `InformacionMedica` | Datos mínimos de salud del ciudadano reportante (alergias, condición preexistente). |
| `LineaDeTiempo` | Colección ordenada e inmutable de eventos con marca de tiempo que documenta la evolución del caso. |
| `EstadoDeEmergencia` | Estado actual del caso en su ciclo de vida: `RECIBIDO`, `EN_ESPERA_DE_ASIGNACION`, `ASIGNADO`, `ATENDIDO_EN_SITIO`, `EN_TRASLADO`, `CERRADO`, `CANCELADO`. |
| `NivelDePrioridad` | Clasificación de urgencia: `CRITICO` (rojo), `URGENTE` (amarillo), `NO_URGENTE` (verde). |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `CasoDeEmergencia` | Entidad raíz que agrupa toda la información del ciclo de vida de la emergencia. Contiene la `Alerta`, el `Triaje`, la `LineaDeTiempo`, el `EstadoDeEmergencia` y el `NivelDePrioridad`. Es la única puerta de entrada para modificar el estado del caso. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeTriaje` | Ejecuta la lógica de clasificación de severidad y asigna el nivel de prioridad correspondiente al caso. |
| `ServicioDeGestionDeCaso` | Coordina las transiciones de estado del caso de emergencia validando las reglas de negocio. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `EmergenciaRecibida` | Se emite cuando el sistema registra una nueva alerta y crea el caso. | Este contexto | Asignación de Paramédico, Enrutamiento |
| `EmergenciaCerrada` | Se emite cuando el caso es cerrado formalmente tras la atención completa. | Este contexto | Analítica, Responsabilidad Legal |
| `EmergenciaCancelada` | Se emite cuando el caso es cancelado antes de ser despachado (ej. falsa alarma). | Este contexto | Analítica |
| `TriajeRealizado` | Se emite cuando el operador completa la clasificación inicial de severidad. | Este contexto | Asignación de Paramédico |
| `PrioridadActualizada` | Se emite cuando el nivel de prioridad del caso cambia (ej. por re-triaje del paramédico en campo). | Atención Prehospitalaria | Este contexto |

## Límites del Contexto

Este contexto es el **núcleo del sistema**. Es el único propietario del estado del caso de emergencia. Ningún otro contexto puede modificar directamente el estado de un `CasoDeEmergencia`; solo puede hacerlo mediante eventos de dominio que este contexto consume y procesa.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Asignación de Paramédico | **Downstream (Cliente)** | Consume `EmergenciaRecibida` y `TriajeRealizado` para iniciar la asignación del paramédico. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Publica actualizaciones de prioridad y condición del paciente al caso activo. |
| Analítica | **Downstream (Cliente)** | Consume eventos de cierre y cancelación para alimentar estadísticas históricas. |
| Responsabilidad Legal | **Downstream (Cliente)** | Registra en auditoría cada cambio de estado del caso de emergencia. |

## Patrones de Integración

- **Orientado a Eventos:** Este contexto publica eventos de dominio a un bus de mensajes. Los contextos consumidores se suscriben de forma asíncrona.
- **Capa Anticorrupción:** Contextos que consumen `EmergenciaRecibida` deben implementar su propia traducción al lenguaje local del contexto.

---

# 2. Contexto de Asignación de Paramédico

**Tipo:** `CORE`

## Propósito

Asignar al paramédico más adecuado a una emergencia activa, gestionando la disponibilidad de paramédicos en tiempo real y recomendando automáticamente el recurso óptimo según ubicación y disponibilidad.

## Responsabilidades

- Recibir notificaciones de nuevas emergencias y triajes realizados.
- Recomendar paramédicos disponibles según proximidad y disponibilidad.
- Registrar y gestionar la asignación formal del paramédico a la emergencia.
- Manejar los flujos de aceptación y rechazo de asignaciones por parte del paramédico.
- Notificar la indisponibilidad de recursos cuando no haya paramédicos disponibles.

## Alcance del Dominio

**Dentro del contexto:**
- Gestión del estado de asignación de paramédicos a emergencias.
- Lógica de recomendación y selección del paramédico más adecuado.
- Confirmación o rechazo de la asignación por parte del paramédico.

**Fuera del contexto:**
- Gestión del ciclo de vida del caso (Contexto de Respuesta a Emergencias).
- Localización en tiempo real del paramédico (Contexto de Localización del Recurso).
- Atención clínica en campo (Contexto de Atención Prehospitalaria).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Caso de Emergencia | Representación local de la emergencia activa que requiere asignación de un paramédico. |
| Paramédico Disponible | Paramédico elegible para ser asignado a una emergencia, con ubicación conocida y estado `DISPONIBLE`. |
| Asignación | Acto formal de vincular un paramédico específico a un caso de emergencia activo. |
| Estado de Emergencia | Estado del caso en el contexto de asignación: `EN_ESPERA_DE_ASIGNACION`, `ASIGNADO`, `CANCELADO`. |
| Recomendación | Lista ordenada de paramédicos elegibles generada automáticamente por el sistema. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `AsignacionDeParamedico` | Representa el vínculo entre un caso de emergencia y el paramédico asignado. Tiene identidad y ciclo de vida propios (pendiente, aceptada, rechazada). |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `EstadoDeEmergencia` | Estado del caso en este contexto: `EN_ESPERA_DE_ASIGNACION`, `ASIGNADO`, `CANCELADO`. |
| `UbicacionDeParamedico` | Posición geográfica del paramédico en el momento de la recomendación. Dato de solo lectura proveniente del Contexto de Localización. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `CasoDeEmergencia` | Representación local del caso que gestiona el proceso de asignación. Contiene el estado de asignación y la referencia al paramédico asignado. *(Nota: Es una representación local del concepto compartido — no reemplaza al AR del Contexto de Respuesta a Emergencias.)* |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeRecomendacionDeParamedico` | Calcula y ordena la lista de paramédicos disponibles para una emergencia según proximidad y disponibilidad. |
| `ServicioDeAsignacion` | Gestiona el flujo de asignación: propone, confirma o reasigna ante un rechazo. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `ParamedicoAsignado` | Se emite cuando se asigna formalmente un paramédico a la emergencia. | Este contexto | Respuesta a Emergencias, Enrutamiento |
| `ParamedicoAcepto` | Se emite cuando el paramédico confirma la aceptación de la asignación en su dispositivo. | Este contexto | Respuesta a Emergencias |
| `ParamedicoRechazo` | Se emite cuando un paramédico rechaza la asignación. | Este contexto | Este contexto (dispara reasignación automática) |
| `RecursoNoDisponible` | Se emite cuando no hay paramédicos disponibles para atender una emergencia activa. | Este contexto | Respuesta a Emergencias |
| `EstadoDeEmergenciaActualizado` | Se emite cuando el estado del caso cambia tras la asignación del paramédico. | Este contexto | Respuesta a Emergencias, Analítica |

## Límites del Contexto

Este contexto es el único propietario de la lógica de asignación de paramédicos. Consume datos de disponibilidad y ubicación del Contexto de Localización del Recurso como datos de solo lectura, sin modificarlos.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Publica `EmergenciaRecibida` y `TriajeRealizado` para iniciar el proceso de asignación. |
| Localización del Recurso | **Upstream (Proveedor)** | Provee la ubicación y disponibilidad actualizadas de los paramédicos. |
| Enrutamiento | **Downstream (Cliente)** | Consume `ParamedicoAsignado` para calcular la ruta hacia el paciente. |
| Analítica | **Downstream (Cliente)** | Consume tiempos de asignación y métricas de disponibilidad. |

## Patrones de Integración

- **Orientado a Eventos:** Consume `EmergenciaRecibida` del bus de mensajes para iniciar el proceso de asignación.
- **Consulta (Modelo de Lectura):** Consulta el estado de disponibilidad de paramédicos mediante una proyección de solo lectura del Contexto de Localización.
- **Confirmación asíncrona:** La aceptación o rechazo del paramédico se comunica mediante eventos desde el dispositivo móvil.

---

# 3. Contexto de Asignación de Centros Médicos

**Tipo:** `CORE`

## Propósito

Asignar el centro médico más adecuado para el traslado del paciente, gestionando la disponibilidad de centros en tiempo real y recomendando automáticamente el destino óptimo según ubicación, nivel de complejidad, especialidades y disponibilidad de camas.

## Responsabilidades

- Recibir la decisión de traslado emitida por el paramédico en campo.
- Recomendar centros médicos elegibles según criterios clínicos y logísticos.
- Registrar la asignación formal del centro médico a la emergencia.
- Gestionar el cambio de centro médico si el paramédico lo solicita durante el traslado.

## Alcance del Dominio

**Dentro del contexto:**
- Lógica de recomendación y selección del centro médico destino.
- Registro de la asignación del centro médico al caso de emergencia.
- Gestión del cambio de centro médico asignado.

**Fuera del contexto:**
- Gestión de la disponibilidad interna del centro médico (Contexto de Centros Médicos).
- Cálculo de la ruta hacia el hospital (Contexto de Enrutamiento).
- Atención clínica en campo (Contexto de Atención Prehospitalaria).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Caso de Emergencia | Representación local del caso activo que requiere asignación de un centro médico para el traslado. |
| Centro Médico Disponible | Centro médico elegible para recibir al paciente: con capacidad, nivel de complejidad y especialidades adecuadas. |
| Asignación de Centro | Acto formal de vincular un centro médico específico como destino de traslado para la emergencia. |
| Estado de Emergencia | Estado del caso en este contexto: `ATENDIDO_EN_SITIO`, `EN_TRASLADO`. |
| Cambio de Centro | Solicitud del paramédico para reasignar el destino del traslado durante la atención. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `AsignacionDeCentroMedico` | Representa el vínculo entre el caso de emergencia y el centro médico asignado como destino de traslado. Tiene identidad y puede ser modificada. |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `CentroMedicoDisponible` | Proyección de solo lectura del centro médico elegible: identificador, ubicación, nivel de complejidad y disponibilidad de camas. |
| `EstadoDeEmergencia` | Estado del caso en este contexto: `ATENDIDO_EN_SITIO`, `EN_TRASLADO`. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `CasoDeEmergencia` | Representación local del caso que gestiona el proceso de asignación del centro médico destino. *(Nota: Es una representación local del concepto compartido — no reemplaza al AR del Contexto de Respuesta a Emergencias.)* |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeRecomendacionDeCentroMedico` | Calcula y ordena la lista de centros médicos elegibles según criterios clínicos (nivel de complejidad, especialidades requeridas) y logísticos (distancia, disponibilidad de camas). |
| `ServicioDeAsignacionDeCentro` | Gestiona el flujo de asignación y el cambio de centro médico durante el traslado. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `CentroMedicoAsignado` | Se emite cuando se asigna formalmente un centro médico a la emergencia como destino de traslado. | Este contexto | Respuesta a Emergencias, Centros Médicos, Enrutamiento |
| `CambioCentroMedico` | Se emite cuando el paramédico solicita y confirma el cambio del centro médico asignado. | Este contexto | Respuesta a Emergencias, Enrutamiento |
| `EstadoDeEmergenciaActualizado` | Se emite cuando el estado del caso cambia tras la asignación o cambio del centro médico. | Este contexto | Respuesta a Emergencias |

## Límites del Contexto

Este contexto es el único propietario de la lógica de asignación del centro médico destino. Consume datos de disponibilidad del Contexto de Centros Médicos como proyecciones de solo lectura.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Publica `EmergenciaRecibida` para iniciar el seguimiento del caso. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Publica `TrasladoDecidido` con los criterios clínicos necesarios para la selección del centro. |
| Centros Médicos | **Upstream (Proveedor)** | Provee la disponibilidad actualizada de los centros médicos (proyección de solo lectura). |
| Enrutamiento | **Downstream (Cliente)** | Consume `CentroMedicoAsignado` para recalcular la ruta hacia el hospital destino. |
| Analítica | **Downstream (Cliente)** | Consume tiempos de asignación de centros y métricas de disponibilidad. |

## Patrones de Integración

- **Orientado a Eventos:** Consume `TrasladoDecidido` del Contexto de Atención Prehospitalaria para iniciar la búsqueda del centro adecuado.
- **Consulta (Modelo de Lectura):** Consulta la disponibilidad de centros médicos mediante una proyección de solo lectura del Contexto de Centros Médicos.

---

# 4. Contexto de Enrutamiento

**Tipo:** `SUPPORTING`

## Propósito

Calcular y gestionar la ruta óptima para que la ambulancia llegue al paciente y, posteriormente, al hospital destino, considerando tráfico, distancia y condiciones del entorno.

## Responsabilidades

- Calcular la ruta óptima desde la posición del paramédico hasta el paciente.
- Recalcular la ruta desde el paciente hasta el hospital destino cuando se emite la decisión de traslado.
- Actualizar el tiempo estimado de llegada (ETA) en tiempo real.
- Detectar y notificar el cambio de fase entre `HACIA_PACIENTE` y `HACIA_HOSPITAL`.
- Confirmar la finalización de la ruta cuando el paramédico llega al hospital.

## Alcance del Dominio

**Dentro del contexto:**
- Cálculo y gestión del ciclo de vida de la ruta activa.
- Actualización dinámica del ETA y segmentos de ruta.
- Gestión de fases del recorrido.

**Fuera del contexto:**
- Localización en tiempo real del paramédico (Contexto de Localización del Recurso).
- Selección del hospital destino (Contexto de Asignación de Centros Médicos).
- Gestión del caso de emergencia (Contexto de Respuesta a Emergencias).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Ruta | Camino calculado para el traslado, con origen, waypoints y destino final. Contiene segmentos y ETA. |
| Segmento de Ruta | Tramo individual de la ruta con distancia, duración estimada y estado de completitud. |
| Tiempo Estimado de Llegada (ETA) | Estimación dinámica del tiempo de llegada al destino activo, recalculada en tiempo real. |
| Fase de Ruta | Etapa activa del recorrido: `HACIA_PACIENTE` (de la base al incidente) o `HACIA_HOSPITAL` (del incidente al hospital). |
| Paramédico Asignado | Referencia al paramédico vinculado a la ruta activa, utilizado para obtener su posición actual. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `SegmentoDeRuta` | Tramo individual de la ruta con distancia, duración estimada y estado. Tiene identidad dentro del agregado. |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `TiempoEstimadoDeLlegada` | Estimación dinámica del tiempo de llegada al destino activo, recalculada en tiempo real. Inmutable en un instante dado. |
| `FaseDeRuta` | Fase activa del recorrido: `HACIA_PACIENTE` o `HACIA_HOSPITAL`. |
| `ReferenciaDeParamedico` | Identificador del paramédico asignado, utilizado como referencia externa. No es una entidad de este contexto. |
| `ReferenciaDeEmergencia` | Identificador del caso de emergencia al que pertenece la ruta. Referencia externa inmutable. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `Ruta` | Entidad raíz que representa el recorrido activo de la ambulancia para una emergencia. Contiene los `SegmentoDeRuta`, el `TiempoEstimadoDeLlegada` y la `FaseDeRuta` actual. Es la única puerta de entrada para modificar el estado del recorrido. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `CalculadorDeRuta` | Invoca el sistema externo de mapas para calcular la ruta óptima y construir los segmentos. |
| `ActualizadorDeETA` | Recalcula el tiempo estimado de llegada en tiempo real a medida que el paramédico avanza. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `RutaCalculada` | Se emite cuando el sistema genera la ruta óptima para una emergencia. | Este contexto | Atención Prehospitalaria |
| `FaseDeCambioDeRuta` | Se emite cuando el paramédico completa la fase `HACIA_PACIENTE` e inicia `HACIA_HOSPITAL`. | Este contexto | Asignación de Centros Médicos, Centros Médicos |
| `RutaCompletada` | Se emite cuando el paramédico llega al hospital y finaliza el traslado. | Este contexto | Respuesta a Emergencias, Analítica |

## Límites del Contexto

Este contexto es el único propietario del ciclo de vida de la `Ruta`. El `CasoDeEmergencia` es referenciado únicamente por su identificador — no se gestiona ni se modifica en este contexto.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Publica `EmergenciaRecibida` para disparar el cálculo de la primera ruta. |
| Asignación de Paramédico | **Upstream (Proveedor)** | Publica `ParamedicoAsignado` con la posición inicial del paramédico. |
| Asignación de Centros Médicos | **Upstream (Proveedor)** | Publica `CentroMedicoAsignado` para recalcular la ruta hacia el hospital destino. |
| Localización del Recurso | **Upstream (Proveedor)** | Provee la posición GPS del paramédico en tiempo real para actualizar el ETA. |
| Centros Médicos | **Downstream (Cliente)** | Consume `FaseDeCambioDeRuta` para iniciar la preparación de recepción del paciente. |
| Atención Prehospitalaria | **Downstream (Cliente)** | Consume `RutaCalculada` para que el paramédico conozca el destino sugerido. |
| Analítica | **Downstream (Cliente)** | Consume tiempos de ruta para métricas de desempeño operativo. |

## Patrones de Integración

- **Orientado a Eventos:** Consume eventos del bus de mensajes para disparar el cálculo o recálculo de rutas.
- **Puerta de Enlace API (externa):** Integra con un proveedor de mapas externo (ej. Google Maps, HERE) para el cálculo de rutas. Se recomienda un Capa Anticorrupción para aislar el dominio de la API externa.

---

# 5. Contexto de Localización del Recurso

**Tipo:** `SUPPORTING`

## Propósito

Gestionar la localización en tiempo real de los recursos operativos (paramédicos). El seguimiento GPS se activa automáticamente cuando el paramédico inicia sesión en la aplicación, marcándolo como disponible, y se desactiva cuando cierra sesión o sale de la aplicación, marcándolo como no disponible.

## Responsabilidades

- Activar la localización GPS en tiempo real cuando el paramédico inicia sesión en la aplicación.
- Actualizar la posición del recurso de forma continua mientras la sesión está activa.
- Desactivar la localización cuando el paramédico cierra sesión o abandona la aplicación.
- Publicar eventos de cambio de disponibilidad para que otros contextos actualicen su información.

## Alcance del Dominio

**Dentro del contexto:**
- Gestión del ciclo de vida de la localización del recurso, vinculado al ciclo de sesión del paramédico en la aplicación.
- Actualización de la posición geográfica en tiempo real mientras la sesión está activa.
- Gestión del estado de disponibilidad del recurso (activo al iniciar sesión, inactivo al cerrar sesión).

**Fuera del contexto:**
- Asignación del recurso a emergencias (Contexto de Asignación de Paramédico).
- Gestión del perfil y autenticación del usuario (Contexto de Manejo de Usuarios).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Recurso | Paramédico registrado en el sistema cuya posición geográfica es rastreada en tiempo real mientras tiene sesión activa en la aplicación. |
| Ubicación | Posición geográfica actual del recurso expresada en coordenadas GPS. |
| Estado de Disponibilidad | Indicador del recurso: `DISPONIBLE` (sesión activa, GPS encendido) o `NO_DISPONIBLE` (sesión cerrada, GPS apagado). |
| Sesión Activa | Estado en que el paramédico ha iniciado sesión en la aplicación y su localización está siendo rastreada en tiempo real. |
| Sesión Cerrada | Estado en que el paramédico ha cerrado sesión o salido de la aplicación, deteniendo el rastreo de su posición. |

## Modelo de Dominio

### Entidades

*(No aplica — el modelo de este contexto se centra en el agregado raíz y sus objetos de valor.)*

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `Ubicacion` | Posición geográfica del recurso en un instante dado: latitud, longitud y marca de tiempo. |
| `EstadoDeDisponibilidad` | Estado actual del recurso: `DISPONIBLE` o `NO_DISPONIBLE`. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `Recurso` | Representa al paramédico rastreable en el sistema. Gestiona su ubicación actual y estado de disponibilidad, vinculado directamente al ciclo de sesión en la aplicación. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeSesion` | Detecta el inicio y cierre de sesión del paramédico en la aplicación y dispara la activación o desactivación del rastreo GPS. |
| `ServicioDeSeguimientoGPS` | Gestiona la recepción y actualización continua de coordenadas GPS desde el dispositivo del paramédico mientras la sesión está activa. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `RecursoActivado` | Se emite cuando el paramédico inicia sesión en la aplicación, activando el GPS y marcándolo como disponible. | Este contexto | Asignación de Paramédico |
| `RecursoDesactivado` | Se emite cuando el paramédico cierra sesión o sale de la aplicación, desactivando el GPS y marcándolo como no disponible. | Este contexto | Asignación de Paramédico |
| `UbicacionActualizada` | Se emite periódicamente con la posición GPS actualizada del recurso mientras tiene sesión activa. | Este contexto | Enrutamiento |

## Límites del Contexto

Este contexto es el único propietario de la posición GPS y el estado de disponibilidad de los recursos. El Contexto de Asignación de Paramédico y el de Enrutamiento consumen esta información como proyecciones de solo lectura.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Asignación de Paramédico | **Downstream (Cliente)** | Consume `RecursoActivado` y `RecursoDesactivado` para actualizar la disponibilidad de paramédicos. |
| Enrutamiento | **Downstream (Cliente)** | Consume `UbicacionActualizada` para recalcular el ETA de la ruta activa. |

## Patrones de Integración

- **Orientado a Eventos:** Publica eventos de disponibilidad y posición al bus de mensajes.
- **Push (dispositivo móvil):** Recibe actualizaciones de posición GPS desde la aplicación del paramédico mediante WebSocket o protocolo push.

---

# 6. Contexto de Manejo de Usuarios

**Tipo:** `SUPPORTING`

## Propósito

Proveer información de los usuarios registrados en el sistema (paramédicos, operadores, analistas) para que otros contextos puedan consultarla con fines de asignación, auditoría o personalización. Este contexto opera en modo de **solo lectura** para los demás contextos del sistema.

## Responsabilidades

- Mantener el registro de usuarios del sistema con su información básica y roles asignados.
- Proveer acceso de consulta a la información de usuarios para otros contextos.
- Emitir eventos ante altas, modificaciones o bajas de usuarios, para trazabilidad y auditoría.

## Alcance del Dominio

**Dentro del contexto:**
- Gestión del ciclo de vida de los usuarios del sistema (registro, actualización, eliminación).
- Consulta de usuarios por rol (paramédicos disponibles, operadores activos, etc.).

**Fuera del contexto:**
- Autenticación y autorización (gestionadas externamente).
- Gestión de disponibilidad operativa del paramédico (Contexto de Localización del Recurso).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Usuario | Persona registrada en el sistema con un rol asignado: Paramédico, Operador o Analista. |
| Paramédico | Usuario con rol operativo que atiende emergencias en campo. |
| Operador | Usuario con rol de centro de mando que gestiona casos de emergencia y asignaciones. |
| Analista | Usuario con rol analítico que consulta reportes y métricas del sistema. |
| Rol | Clasificación funcional del usuario que determina sus permisos y responsabilidades en el sistema. |
| Recurso Operativo | Perfil operativo de un usuario (específicamente un paramédico) referenciado por otros contextos para asignación. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `Paramedico` | Usuario con rol de paramédico. Tiene identidad propia y atributos específicos (licencia, especialidades). |
| `Operador` | Usuario con rol de operador. Tiene identidad propia y permisos de gestión de casos. |
| `Analista` | Usuario con rol analítico. Tiene identidad propia y permisos de consulta de reportes. |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `Rol` | Clasificación del usuario: `PARAMEDICO`, `OPERADOR`, `ANALISTA`. Inmutable una vez asignado. |
| `RecursoOperativo` | Proyección del perfil de un usuario paramédico referenciado por otros contextos. Incluye identificador y rol. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `Usuario` | Entidad raíz que representa a un usuario registrado. Contiene su información básica, el `Rol` asignado y la referencia al perfil operativo correspondiente. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ConsultaDeUsuarios` | Provee métodos de consulta de usuarios filtrados por rol, para ser usados por otros contextos como proyección de solo lectura. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `UsuarioRegistrado` | Se emite cuando un nuevo usuario es dado de alta en el sistema. | Este contexto | Responsabilidad Legal |
| `UsuarioActualizado` | Se emite cuando la información de un usuario registrado es modificada. | Este contexto | Responsabilidad Legal |
| `UsuarioEliminado` | Se emite cuando un usuario registrado es dado de baja del sistema. | Este contexto | Responsabilidad Legal |

## Límites del Contexto

Este contexto es el único propietario del registro de usuarios. Los demás contextos que necesiten datos de usuarios deben consultarlos mediante la proyección `RecursoOperativo` o suscribirse a sus eventos — nunca gestionar usuarios directamente.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Responsabilidad Legal | **Downstream (Cliente)** | Consume eventos de alta, modificación y baja de usuarios para registro de auditoría. |
| Localización del Recurso | **Downstream (Cliente)** | Referencia al `RecursoOperativo` para vincular al paramédico con su localización GPS. |

## Patrones de Integración

- **Orientado a Eventos:** Publica eventos de ciclo de vida de usuarios al bus de mensajes.
- **Consulta (Modelo de Lectura):** Expone una API de consulta de solo lectura para que otros contextos obtengan datos de usuarios sin acoplarlos a este dominio.

---

# 7. Contexto de Atención Prehospitalaria

**Tipo:** `CORE`

## Propósito

Registrar y gestionar la evaluación clínica del paciente realizada por el paramédico en la escena de la emergencia, incluyendo el re-triaje, los signos vitales, los tratamientos aplicados y la decisión de traslado.

## Responsabilidades

- Registrar el re-triaje presencial del paciente en campo.
- Capturar y almacenar los signos vitales del paciente durante la atención en escena.
- Registrar los tratamientos aplicados por el paramédico.
- Registrar la condición clínica del paciente en cada momento de la evaluación.
- Emitir la decisión de traslado con el destino y modalidad de traslado requeridos.
- Notificar al resto del sistema los cambios en la condición y prioridad del paciente.

## Alcance del Dominio

**Dentro del contexto:**
- Gestión del ciclo de vida de la evaluación prehospitalaria.
- Registro de tratamientos y signos vitales.
- Lógica del re-triaje y actualización de la condición del paciente.
- Emisión de la decisión de traslado.

**Fuera del contexto:**
- Asignación del centro médico destino (Contexto de Asignación de Centros Médicos).
- Cálculo de la ruta hacia el hospital (Contexto de Enrutamiento).
- Gestión del estado del caso (Contexto de Respuesta a Emergencias).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Evaluación Prehospitalaria | Evaluación médica completa realizada por el paramédico en la escena de la emergencia. |
| Re-Triaje | Nueva clasificación de prioridad del paciente basada en la evaluación presencial del paramédico en campo, que puede modificar la prioridad inicial asignada por el operador. |
| Signos Vitales | Mediciones clínicas del paciente tomadas en escena: presión arterial, frecuencia cardíaca, saturación de oxígeno y escala de Glasgow. |
| Tratamiento | Intervención médica específica aplicada al paciente en campo por el paramédico (ej. inmovilización, suero, desfibrilación). |
| Decisión de Traslado | Determinación clínica sobre el destino hospitalario del paciente: tipo de centro requerido, nivel de urgencia y modo de traslado. |
| Evaluación Clínica | Resumen estructurado del estado clínico del paciente al finalizar la evaluación en campo. |
| Condición del Paciente | Estado clínico del paciente en un momento dado: `ESTABLE`, `CRÍTICO`, `MEJORANDO`, `DETERIORANDO`. |
| Información Médica | Información clínica relevante del paciente utilizada durante la evaluación prehospitalaria. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `Tratamiento` | Intervención médica aplicada al paciente. Tiene identidad y marca de tiempo de aplicación. Puede haber múltiples tratamientos por evaluación. |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `SignosVitales` | Conjunto de mediciones clínicas del paciente en un instante dado: presión arterial, pulso, saturación y Glasgow. Inmutable una vez registrado. |
| `CondicionDelPaciente` | Estado clínico del paciente: `ESTABLE`, `CRÍTICO`, `MEJORANDO`, `DETERIORANDO`. |
| `NivelDePrioridad` | Nivel de urgencia reclasificado por el paramédico: `CRITICO`, `URGENTE`, `NO_URGENTE`. |
| `DecisionDeTraslado` | Datos de la decisión clínica sobre el traslado: tipo de centro requerido, urgencia y modo de traslado. |
| `EvaluacionClinica` | Resumen estructurado del estado clínico del paciente al finalizar la evaluación en campo. |
| `InformacionMedica` | Datos clínicos relevantes del paciente (alergias, condiciones preexistentes) utilizados durante la atención. |
| `ReferenciaDeEmergencia` | Identificador del caso de emergencia al que pertenece esta evaluación. Referencia externa inmutable. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `EvaluacionPrehospitalaria` | Entidad raíz que representa la evaluación clínica completa realizada en campo. Contiene los `Tratamiento`, los `SignosVitales`, la `CondicionDelPaciente`, la `EvaluacionClinica` y la `DecisionDeTraslado`. Es la única puerta de entrada para registrar información clínica del paciente. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeReTriaje` | Aplica la lógica de re-triaje en base a los signos vitales y condición clínica registrados, y emite el evento `ReTriajeRealizado` si el nivel de prioridad cambia. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `ReTriajeRealizado` | Se emite cuando el paramédico reclasifica la prioridad del paciente en campo. | Este contexto | Respuesta a Emergencias |
| `RegistroDeEvaluacion` | Se emite cada vez que el paramédico registra información clínica (signos vitales, tratamiento, condición). | Este contexto | Respuesta a Emergencias, Analítica |
| `TrasladoDecidido` | Se emite cuando el paramédico define el centro sanitario destino y el modo de traslado. | Este contexto | Asignación de Centros Médicos, Enrutamiento |
| `EvaluacionFinalizada` | Se emite cuando el paramédico completa la evaluación y el paciente está listo para traslado. | Este contexto | Respuesta a Emergencias, Analítica |

## Límites del Contexto

Este contexto es el único propietario del registro clínico prehospitalario. La `DecisionDeTraslado` es emitida como evento (`TrasladoDecidido`) — el contexto no selecciona el centro médico, solo comunica los criterios clínicos necesarios para esa selección.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Downstream (Cliente)** | Consume `ReTriajeRealizado` para actualizar la prioridad del caso. |
| Asignación de Centros Médicos | **Downstream (Cliente)** | Consume `TrasladoDecidido` para iniciar la búsqueda del centro médico adecuado. |
| Enrutamiento | **Downstream (Cliente)** | Consume `TrasladoDecidido` para iniciar el recálculo de ruta hacia el hospital. |
| Responsabilidad Legal | **Downstream (Cliente)** | Registra en auditoría cada tratamiento aplicado al paciente en campo. |
| Analítica | **Downstream (Cliente)** | Consume evaluaciones finalizadas para estadísticas de tipos de intervención y condición clínica. |

## Patrones de Integración

- **Orientado a Eventos:** Publica todos los eventos al bus de mensajes. Los contextos consumidores se suscriben de forma asíncrona.
- **Push (dispositivo móvil):** Recibe los registros clínicos desde la aplicación del paramédico en tiempo real.

---

# 8. Contexto de Centros Médicos

**Tipo:** `SUPPORTING`

## Propósito

Mantener el catálogo de centros médicos disponibles en el sistema con su información operativa: nivel de complejidad, capacidad actual y servicios especializados disponibles. Es la fuente de verdad sobre la disponibilidad de centros médicos en el sistema.

## Responsabilidades

- Registrar y mantener actualizado el catálogo de centros médicos.
- Gestionar la capacidad actual y disponibilidad de camas por servicio.
- Publicar actualizaciones de capacidad para que otros contextos puedan tomar decisiones informadas.
- Registrar la entrega del paciente al centro médico y emitir el evento de cierre de ciclo.

## Alcance del Dominio

**Dentro del contexto:**
- Gestión del catálogo de centros médicos y sus atributos operativos.
- Actualización de disponibilidad de camas y servicios.

**Fuera del contexto:**
- Selección del centro médico para una emergencia específica (Contexto de Asignación de Centros Médicos).
- Cálculo de ruta hacia el hospital (Contexto de Enrutamiento).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Centro Médico | Institución de salud registrada en el sistema que puede recibir pacientes trasladados por emergencias. |
| Capacidad | Estado actual de ocupación del centro: número de camas libres por servicio en tiempo real. |
| Nivel de Complejidad | Clasificación del centro según su capacidad de atención: `BÁSICO`, `INTERMEDIO`, `ALTO`. |
| Disponibilidad de Camas | Número de camas libres por servicio específico (UCI, Urgencias, Trauma, etc.) en un momento dado. |
| Servicio Especializado | Servicio médico de alta complejidad disponible en el centro: UCI, Trauma, Quemados, Neonatología, etc. |
| Entrega de Paciente | Acto de transferencia formal del paciente al centro médico por parte del paramédico. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `ServicioEspecializado` | Servicio médico disponible en el centro. Tiene identidad dentro del agregado y su disponibilidad puede cambiar independientemente. |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `Capacidad` | Estado actual de ocupación del centro, expresado como número de camas libres por servicio. |
| `NivelDeComplejidad` | Nivel de complejidad del centro: `BÁSICO`, `INTERMEDIO`, `ALTO`. Inmutable. |
| `Ubicacion` | Dirección y coordenadas geográficas del centro médico. |
| `DisponibilidadDeCamas` | Número de camas libres por servicio específico en un momento dado. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `CentroMedico` | Entidad raíz que representa un centro médico con su información operativa. Gestiona la `Capacidad`, el `NivelDeComplejidad`, los `ServicioEspecializado` disponibles y la `DisponibilidadDeCamas`. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeActualizacionDeCapacidad` | Procesa las actualizaciones de disponibilidad de camas enviadas por los centros médicos y publica el evento `CapacidadActualizada`. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `CapacidadActualizada` | Se emite cuando un centro médico actualiza su disponibilidad de camas en tiempo real. | Este contexto | Asignación de Centros Médicos |
| `PacienteEntregado` | Se emite cuando el paramédico entrega formalmente al paciente en el centro médico, cerrando el ciclo de atención prehospitalaria. | Este contexto | Respuesta a Emergencias, Analítica |
| `FaseDeCambioDeRuta` | *(Consumido, no producido.)* Se consume cuando el paramédico inicia la fase de traslado hacia el centro, para preparar la recepción del paciente. | Enrutamiento | Este contexto |

## Límites del Contexto

Este contexto es el único propietario del catálogo y la disponibilidad de los centros médicos. La selección de un centro para una emergencia específica es responsabilidad del Contexto de Asignación de Centros Médicos, que consulta este contexto como fuente de datos.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Enrutamiento | **Upstream (Proveedor)** | Publica `FaseDeCambioDeRuta` para que este contexto inicie la preparación de recepción del paciente. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Publica `TrasladoDecidido` con los criterios clínicos del paciente. |
| Asignación de Centros Médicos | **Downstream (Cliente)** | Consulta la disponibilidad de centros médicos para seleccionar el destino de traslado. |
| Respuesta a Emergencias | **Downstream (Cliente)** | Consume `PacienteEntregado` para cerrar formalmente el caso de emergencia. |
| Analítica | **Downstream (Cliente)** | Consume datos de ocupación, tiempos de derivación y disponibilidad por centro. |
| Responsabilidad Legal | **Downstream (Cliente)** | Registra en auditoría las derivaciones realizadas y la entrega de pacientes. |

## Patrones de Integración

- **Orientado a Eventos:** Publica `CapacidadActualizada` y `PacienteEntregado` al bus de mensajes.
- **Push (centro médico):** Recibe actualizaciones de disponibilidad desde los sistemas de los centros médicos mediante API o integración directa.

---

# 9. Contexto de Analítica

**Tipo:** `SUPPORTING`

## Propósito

Procesar y analizar los datos históricos y en tiempo real de las emergencias para generar reportes, métricas de desempeño y visualizaciones que permitan a los tomadores de decisión evaluar el servicio e identificar áreas de mejora.

## Responsabilidades

- Consumir y procesar eventos de todos los contextos del sistema.
- Generar reportes periódicos (diarios, semanales, mensuales) con métricas agregadas.
- Calcular y publicar indicadores de desempeño operativo.
- Detectar y notificar cuando una métrica supera un umbral crítico.
- Proveer datos anonimizados para reportes regulatorios y auditoría.

## Alcance del Dominio

**Dentro del contexto:**
- Procesamiento y almacenamiento de eventos históricos del sistema.
- Generación de reportes y métricas de desempeño.
- Anonimización de datos para análisis y cumplimiento.

**Fuera del contexto:**
- Gestión operativa de emergencias (otros contextos CORE).
- Acciones correctivas basadas en métricas (decisión humana o de otros sistemas).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Reporte | Documento generado automáticamente con análisis agregado de emergencias en un período de tiempo. |
| Mapa de Calor | Visualización geográfica de zonas con mayor incidencia de emergencias en un período determinado. |
| Registro Anonimizado | Registro de emergencia con datos personales eliminados o enmascarados para su uso en análisis estadístico. |
| Métricas de Desempeño | Indicadores clave del sistema: tiempos de respuesta promedio, tasa de resolución, cobertura geográfica. |
| Alerta de Desempeño | Notificación generada automáticamente cuando una métrica supera un umbral crítico configurado. |

## Modelo de Dominio

### Entidades

*(No aplica — este contexto trabaja principalmente con proyecciones y agregados de solo lectura.)*

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `MetricasDeDesempenio` | Conjunto de indicadores calculados: tiempos de respuesta, tasa de éxito, cobertura. Inmutable en un período dado. |
| `MapaDeCalor` | Representación geográfica de la distribución de emergencias en un período. |
| `RegistroAnonimizado` | Registro de emergencia con datos personales suprimidos o enmascarados. |
| `PeriodoDeReporte` | Rango temporal del reporte: fecha de inicio, fecha de fin y tipo (diario, semanal, mensual). |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `Reporte` | Entidad raíz que representa el análisis agregado generado para un período. Contiene las `MetricasDeDesempenio`, el `MapaDeCalor` y los `RegistroAnonimizado` correspondientes al período. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `GeneradorDeReportes` | Orquesta la recopilación de datos, el cálculo de métricas y la generación del reporte para un período dado. |
| `CalculadorDeMetricas` | Calcula indicadores de desempeño a partir de los eventos recibidos del sistema. |
| `DetectorDeAlertas` | Evalúa las métricas calculadas contra los umbrales configurados y emite `AlertaDeDesempenio` cuando corresponde. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `ReporteGenerado` | Se emite cuando el sistema crea automáticamente un reporte periódico. | Este contexto | Soporte al Usuario, Responsabilidad Legal |
| `MetricaCalculada` | Se emite cuando se recalcula un indicador de desempeño tras procesar nuevos eventos. | Este contexto | — (consumo interno / dashboards) |
| `AlertaDeDesempenio` | Se emite cuando una métrica supera un umbral crítico (ej. tiempo de respuesta excesivo). | Este contexto | Respuesta a Emergencias (notificación operativa) |

## Límites del Contexto

Este contexto es de solo lectura respecto al dominio operativo. No modifica ningún estado en otros contextos. Sus proyecciones y reportes son inmutables una vez generados.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Provee eventos de creación, cierre y cancelación de casos. |
| Asignación de Paramédico | **Upstream (Proveedor)** | Provee tiempos de asignación y disponibilidad de paramédicos. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Provee evaluaciones finalizadas para análisis de intervenciones clínicas. |
| Centros Médicos | **Upstream (Proveedor)** | Provee datos de ocupación, tiempos de derivación y disponibilidad por centro. |
| Responsabilidad Legal | **Downstream (Cliente)** | Consume reportes consolidados para elaborar reportes regulatorios. |
| Soporte al Usuario | **Downstream (Cliente)** | Consume reportes para responder consultas técnicas de usuarios. |

## Patrones de Integración

- **Abastecimiento de Eventos / Almacén de Eventos:** Almacena todos los eventos entrantes como fuente de verdad para la generación de reportes y métricas.
- **CQRS (Modelo de Lectura):** Opera exclusivamente como modelo de lectura. No genera comandos ni modifica otros contextos.

---

# 10. Contexto de Responsabilidad Legal

**Tipo:** `SUPPORTING`

## Propósito

Gestionar el cumplimiento normativo del sistema, manteniendo registros de auditoría inmutables, generando reportes para organismos reguladores y gestionando los contratos con hospitales y proveedores.

## Responsabilidades

- Registrar de forma inmutable todas las acciones críticas del sistema para auditoría.
- Generar reportes regulatorios para organismos de control.
- Generar y entregar el número de radicado al ciudadano al momento de crear una emergencia.
- Detectar posibles indicadores de incumplimiento normativo.

## Alcance del Dominio

**Dentro del contexto:**
- Registro de auditoría inmutable de acciones del sistema.
- Gestión del ciclo de vida de contratos con terceros.
- Generación de reportes regulatorios.
- Gestión de radicados y notificaciones al ciudadano.

**Fuera del contexto:**
- Análisis estadístico de datos (Contexto de Analítica).
- Gestión operativa de emergencias (contextos CORE).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Registro de Auditoría | Entrada inmutable que documenta una acción crítica del sistema: quién la ejecutó, qué hizo, cuándo y con qué resultado. |
| Reporte Regulatorio | Informe generado para cumplir con requerimientos normativos de organismos reguladores. |
| Indicador de Cumplimiento | Señal que identifica una posible violación o riesgo de incumplimiento normativo detectado en el sistema. |
| Regla de Cumplimiento | Regla normativa configurada en el sistema que debe verificarse en las operaciones del servicio. |
| Número de Radicado | Identificador único asignado al caso de emergencia, entregado al ciudadano como constancia de recepción. |
| Documento Legal | Documento formal asociado a un proceso de auditoría o regulatorio del sistema. |

## Modelo de Dominio

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `NumeroDeRadicado` | Identificador único e inmutable asignado al caso de emergencia para trazabilidad legal. |
| `IndicadorDeCumplimiento` | Señal que marca una posible violación o riesgo de incumplimiento normativo. |
| `ReglaDeCumplimiento` | Regla normativa configurada en el sistema que debe verificarse en las operaciones. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `RegistroDeAuditoria` | Entrada inmutable que documenta una acción crítica del sistema. Una vez creado, no puede ser modificado ni eliminado. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeAuditoria` | Procesa los eventos entrantes de todos los contextos y crea los registros de auditoría correspondientes. |
| `GeneradorDeReportesRegulatories` | Consolida registros de auditoría y datos de Analítica para generar reportes destinados a organismos reguladores. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `RegistroDeAuditoriaCreado` | Se emite cada vez que se registra una acción crítica del sistema para auditoría. | Este contexto | Analítica |
| `ReporteRegulatorioGenerado` | Se emite cuando se genera un reporte para cumplir con requerimientos normativos. | Este contexto | Analítica |
| `RadicadoCreado` | Se emite cuando se crea un radicado y se envía un SMS de confirmación al ciudadano. | Este contexto | Soporte al Usuario |

## Límites del Contexto

Este contexto es el único propietario de los registros de auditoría. Los registros de auditoría son inmutables. Ningún otro contexto puede crear, modificar ni eliminar registros de auditoría directamente.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Publica eventos de creación, cierre y cancelación de casos para registro de auditoría. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Publica eventos de tratamientos aplicados para auditoría clínica. |
| Manejo de Usuarios | **Upstream (Proveedor)** | Publica eventos de alta, modificación y baja de usuarios para auditoría. |
| Analítica | **Upstream (Proveedor)** | Provee reportes consolidados para la elaboración de reportes regulatorios. |
| Soporte al Usuario | **Upstream (Proveedor)** | Publica tickets y quejas escaladas para seguimiento legal cuando corresponda. |
| Soporte al Usuario | **Downstream (Cliente)** | Consume `RadicadoCreado` para notificar al ciudadano mediante SMS. |

## Patrones de Integración

- **Orientado a Eventos:** Consume eventos de todos los contextos del sistema para generar registros de auditoría de forma automática.
- **Almacén de Solo Escritura:** Los registros de auditoría se almacenan en un repositorio de solo escritura, garantizando su inmutabilidad.

---

# 11. Contexto de Soporte al Usuario

**Tipo:** `GENERIC`

## Propósito

Gestionar las solicitudes de soporte, quejas, reclamos y sugerencias (PQRS) de los usuarios del sistema, haciendo seguimiento de cada caso hasta su resolución y recopilando retroalimentación para mejorar el servicio.

## Responsabilidades

- Recibir y registrar solicitudes PQRS de ciudadanos, paramédicos y operadores.
- Gestionar el ciclo de vida de los tickets de soporte desde la apertura hasta el cierre.
- Escalar quejas que superen el tiempo de respuesta establecido.
- Recopilar retroalimentación voluntaria de los usuarios sobre la calidad del servicio.
- Notificar al ciudadano el radicado de su emergencia cuando sea recibido del Contexto de Responsabilidad Legal.

## Alcance del Dominio

**Dentro del contexto:**
- Gestión de tickets de soporte y quejas formales.
- Escalamiento de casos sin resolución oportuna.
- Recopilación de retroalimentación voluntaria.

**Fuera del contexto:**
- Gestión operativa de emergencias (contextos CORE).
- Análisis estadístico de retroalimentación (Contexto de Analítica).
- Investigación legal de quejas graves (Contexto de Responsabilidad Legal).

## Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Ticket de Soporte | Caso de soporte abierto por un usuario para reportar un problema o solicitar ayuda, con historial y resolución. |
| Queja | Solicitud formal de un usuario sobre el servicio recibido, que requiere investigación y respuesta oficial. |
| PQRS | Clasificación de solicitudes de usuarios: Petición, Queja, Reclamo o Sugerencia. |
| Resolución | Resultado final de la atención de un Ticket de Soporte: solución aplicada, estado de cierre y nivel de satisfacción. |
| Escalamiento | Proceso de elevar una queja a instancias superiores cuando supera el tiempo de respuesta sin resolución. |
| Retroalimentación del Usuario | Valoración voluntaria del usuario sobre su experiencia con el servicio de atención de emergencias. |
| Evidencia | Archivos adjuntos o pruebas aportadas por el usuario para sustentar su queja o reclamo. |

## Modelo de Dominio

### Entidades

| Nombre | Descripción |
|---|---|
| `Mensaje` | Comunicación individual dentro de un ticket, enviada por el usuario o el agente de soporte. Tiene identidad y marca de tiempo. |

### Objetos de Valor

| Nombre | Descripción |
|---|---|
| `Resolucion` | Resultado final del ticket: descripción de la solución aplicada, estado de cierre y valoración de satisfacción. |
| `Evidencia` | Archivos adjuntos o pruebas aportadas por el usuario. Inmutable una vez adjuntada. |
| `RetroalimentacionDelUsuario` | Valoración voluntaria del usuario: puntuación y comentario sobre la calidad del servicio. |
| `Sugerencia` | Propuesta de mejora enviada por un usuario sobre procesos, herramientas o atención. |
| `TipoDeSolicitud` | Clasificación de la solicitud: `PETICION`, `QUEJA`, `RECLAMO`, `SUGERENCIA`. |

### Agregados

| Raíz de Agregado | Descripción |
|---|---|
| `TicketDeSoporte` | Entidad raíz que representa una solicitud PQRS completa. Contiene los `Mensaje`, la `Resolucion`, la `Evidencia` y el `TipoDeSolicitud`. Gestiona el ciclo de vida desde la apertura hasta el cierre. |

### Servicios de Dominio

| Servicio | Descripción |
|---|---|
| `ServicioDeEscalamiento` | Monitorea los tickets abiertos sin resolución y ejecuta el escalamiento cuando se supera el tiempo de respuesta configurado. |

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `TicketCreado` | Se emite cuando un usuario abre un nuevo caso de soporte o PQRS. | Este contexto | Responsabilidad Legal |
| `QuejaEscalada` | Se emite cuando una queja supera el tiempo de respuesta establecido sin resolución. | Este contexto | Responsabilidad Legal |
| `TicketResuelto` | Se emite cuando el agente cierra formalmente el ticket con una resolución. | Este contexto | Analítica |
| `RetroalimentacionRecibida` | Se emite cuando un usuario envía una valoración voluntaria del servicio. | Este contexto | Analítica |

## Límites del Contexto

Este contexto es el único propietario del ciclo de vida de los tickets de soporte. No interactúa directamente con el dominio operativo de emergencias — accede a información de casos únicamente a través de los reportes del Contexto de Analítica.

## Contextos Externos

| Contexto | Tipo de relación | Descripción |
|---|---|---|
| Analítica | **Upstream (Proveedor)** | Provee reportes y datos del sistema para responder consultas técnicas de usuarios. |
| Responsabilidad Legal | **Downstream (Cliente)** | Consume `TicketCreado` y `QuejaEscalada` para registro y seguimiento legal. |
| Responsabilidad Legal | **Upstream (Proveedor)** | Publica `RadicadoCreado` para que este contexto notifique al ciudadano mediante SMS. |

## Patrones de Integración

- **Orientado a Eventos:** Publica eventos del ciclo de vida de tickets al bus de mensajes.
- **Notificación externa:** Integra con un proveedor de SMS externo para entregar el número de radicado al ciudadano. Se recomienda un Capa Anticorrupción para aislar el dominio de la API del proveedor.

---
