# Bounded Contexts Detallados
## Sistema de Atención de Emergencias (SIE)

---

## Índice

1. [Contexto de Respuesta a Emergencias](#1-contexto-de-respuesta-a-emergencias)
2. [Contexto de Despacho y Enrutamiento](#2-contexto-de-despacho-y-enrutamiento)
3. [Contexto de Atención Prehospitalaria](#3-contexto-de-atención-prehospitalaria)
4. [Contexto de Gestión de Recursos](#4-contexto-de-gestión-de-recursos)
5. [Contexto de Integración Sanitaria](#5-contexto-de-integración-sanitaria)
6. [Contexto de Analítica y Reportes](#6-contexto-de-analítica-y-reportes)
7. [Contexto de Soporte al Usuario](#7-contexto-de-soporte-al-usuario)
8. [Contexto de Cumplimiento y Legal](#8-contexto-de-cumplimiento-y-legal)

---

## 1. Contexto de Respuesta a Emergencias

**Tipo:** `CORE` 

### Responsabilidad

Gestionar el ciclo de vida completo de una emergencia, desde la recepción de la alerta inicial hasta el cierre formal del caso. Es el contexto central del sistema y el punto de entrada de toda operación de atención. Coordina la creación del caso, la clasificación por triaje y el seguimiento del estado hasta su resolución.

---

### Actores

| Actor | Rol |
|---|---|
| Ciudadano | Reporta la emergencia a través del canal de atención (línea telefónica, app, etc.). |
| Operador | Recibe la alerta, crea el caso de emergencia y ejecuta el triaje inicial. |
| Sistema SIE | Registra automáticamente eventos, cambios de estado y la línea de tiempo del caso. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Aggregate Root | `CasoDeEmergencia` | Entidad principal que agrupa toda la información del ciclo de vida de la emergencia. |
| Entity | `Triaje` | Evaluación de severidad del paciente realizada por el operador al momento de la alerta. |
| Value Object | `Alerta` | Datos de la notificación inicial: canal de entrada, hora, descripción del incidente. |
| Value Object | `LineaDeTiempo` | Colección ordenada de eventos con marca de tiempo que documenta la evolución del caso. |
| Value Object | `ReferenciaDelCiudadano` | Datos mínimos del ciudadano reportante (puede ser anónimo). |
| Value Object | `EstadoDeEmergencia` | Estado actual del caso: `RECIBIDO`, `EN_PROCESO`, `DESPACHADO`, `CERRADO`, `CANCELADO`. |
| Value Object | `NivelDePrioridad` | Clasificación de urgencia: `CRITICO` (rojo), `URGENTE` (amarillo), `NO URGENTE` (verde). |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Caso de Emergencia | Instancia completa de una emergencia desde el reporte inicial hasta el cierre del caso. |
| Alerta | Notificación inicial recibida por el sistema que activa el proceso de atención. |
| Triaje | Evaluación y clasificación de la severidad del paciente realizada por el operador. |
| Nivel de Prioridad | Nivel de urgencia asignado: ROJO (crítico), AMARILLO (urgente), VERDE (no urgente). |
| Estado de Emergencia | Estado del ciclo de vida del caso: RECIBIDO, EN_PROCESO, DESPACHADO, CERRADO, CANCELADO. |
| Línea de Tiempo | Registro cronológico de todos los eventos y cambios de estado del caso. |
| Referencia del Ciudadano | Referencia minima identificada del ciudadano que reportó la emergencia. |

---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `EmergenciaRecibida` | Se emite cuando el sistema registra una nueva alerta y crea el caso. | Este contexto | Despacho y Enrutamiento |
| `TriajeRealizado` | Se emite cuando el operador completa la clasificación inicial de severidad. | Este contexto | Despacho y Enrutamiento |
| `PrioridadActualizada` | Se emite cuando el nivel de prioridad del caso cambia (ej. por re-triaje del paramédico). | Atención Prehospitalaria | Este contexto |
| `EmergenciaCerrada` | Se emite cuando el caso es cerrado formalmente tras la atención completa. | Este contexto | Analítica y Reportes, Cumplimiento y Legal |
| `EmergenciaCancelada` | Se emite cuando el caso es cancelado antes de ser despachado (ej. falsa alarma). | Este contexto | Analítica y Reportes |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Despacho y Enrutamiento | **Downstream (Cliente)** | Recibe `EmergenciaRecibida` y `TriajeRealizado` para iniciar la asignación de recursos. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Publica actualizaciones de prioridad y condición del paciente al caso activo. |
| Analítica y Reportes | **Downstream (Cliente)** | Consume eventos de cierre y cancelación para alimentar estadísticas históricas. |
| Cumplimiento y Legal | **Downstream (Cliente)** | Registra en auditoría cada cambio de estado del caso de emergencia. |

---

## 2. Contexto de Despacho y Enrutamiento

**Tipo:** `CORE` 

### Responsabilidad

Asignar la unidad de emergencia más adecuado (ambulancia + tripulación) a una emergencia activa y calcular la ruta óptima en dos fases: hacia el paciente y hacia el hospital destino. Gestiona la coordinación en tiempo real entre el operador, el sistema de mapas y los recursos disponibles, garantizando los tiempos de respuesta más bajos posibles.

---

### Actores

| Actor | Rol |
|---|---|
| Operador | Confirma o ajusta manualmente la asignación propuesta por el sistema. |
| Sistema de enrutamiento | Calcula rutas óptimas considerando tráfico, distancia y disponibilidad. |
| Paramédico | Recibe la asignación en su dispositivo y confirma la aceptación del despacho. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Aggregate Root | `AsignaciónDeDespacho` | Entidad que vincula una emergencia con una unidad de emergencia y gestiona las fases de la ruta. |
| Value Object | `Ruta` | Camino calculado con origen, waypoints y destino final. Contiene segmentos y ETA. |
| Value Object | `SegmentoDeRuta` | Tramo individual de la ruta con distancia, duración estimada y estado. |
| Value Object | `GeoLocalización` | Coordenadas geográficas (latitud/longitud) de un punto de interés en la ruta. |
| Value Object | `TiempoEstimadoDeLlegada` | Estimación dinámica del tiempo de llegada al destino activo, recalculada en tiempo real. |
| Value Object | `RecursoDisponible` | Snapshot del recurso elegible: ambulancia, tripulación, ubicación y estado al momento de la asignación. |
| Value Object | `FaseDeRuta` | Fase activa del recorrido: `HACIA_PACIENTE` o `HACIA_HOSPITAL`. |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Asignación de Despacho | Asignación formal de una ambulancia y tripulación a una emergencia específica. |
| Ruta | Camino calculado con origen, destino intermedio y destino final, incluyendo waypoints. |
| Tiempo Estimado de Llegada | Tiempo estimado de llegada al punto de destino activo. |
| Fase de Ruta | Fase activa del recorrido: HACIA_PACIENTE o HACIA_HOSPITAL. |
| Geolocalización | Coordenadas geográficas (latitud/longitud) de un punto de interés en el recorrido. |
| Recurso Disponible | Recurso (ambulancia + tripulación) elegible para ser asignado a una emergencia. |
| Segmento de Ruta | Tramo individual del recorrido con distancia, duración y estado propio. |

---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `DespachoAsignado` | Se emite cuando se asigna formalmente un recurso a la emergencia. | Este contexto | Respuesta a Emergencias, Gestión de Recursos |
| `RutaCalculada` | Se emite cuando el sistema genera la ruta óptima hacia el paciente. | Este contexto | Atención Prehospitalaria |
| `FaseDeCambioDeRuta` | Se emite cuando la ambulancia completa la fase `HACIA_PACIENTE` e inicia `HACIA_HOSPITAL`. | Este contexto | Integración Sanitaria |
| `DespachoCompletado` | Se emite cuando la ambulancia llega al hospital y finaliza el traslado. | Este contexto | Respuesta a Emergencias, Analítica y Reportes |
| `RecursoNoDisponible` | Se emite cuando no hay recursos disponibles para atender una emergencia activa. | Este contexto | Respuesta a Emergencias |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Consume `EmergenciaRecibida` y `TriajeRealizado` para iniciar el proceso de asignación. |
| Gestión de unidad de emergencia | **Downstream (Cliente)** | Consulta disponibilidad de ambulancias y actualiza su estado tras el despacho. |
| Integración de salud | **Downstream (Cliente)** | Publica `FaseDeCambioDeRuta` para que el centro sanitario inicie la preparación de recepción. |
| Atención Prehospitalaria | **Downstream (Cliente)** | Publica la ruta calculada para que el paramédico conozca el destino hospitalario sugerido. |
| Analítica y Reportes | **Downstream (Cliente)** | Consume tiempos de despacho y ruta para métricas de desempeño operativo. |

---

## 3. Contexto de Atención Prehospitalaria

**Tipo:** `CORE`

### Responsabilidad

Gestionar la atención médica que brindan los paramédicos en la escena de la emergencia, antes del traslado al hospital. Registra la evaluación clínica, los signos vitales, los tratamientos aplicados y la decisión de traslado. Es la fuente de verdad sobre el estado clínico del paciente durante la fase de campo.

---

### Actores

| Actor | Rol |
|---|---|
| Paramédico | Ejecuta la evaluación, registra signos vitales, aplica tratamientos y decide el traslado. |
| Sistema SIE | Recibe y almacena la información clínica enviada desde el dispositivo del paramédico. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Aggregate Root | `EvaluaciónPrehospitalaria` | Evaluación médica completa realizada por el paramédico en la escena. |
| Entity | `Tratamiento` | Intervención médica específica aplicada al paciente (ej. inmovilización, suero, desfibrilación). |
| Value Object | `SignosVitales` | Mediciones clínicas del paciente: presión arterial, pulso, saturación de oxígeno, Glasgow. |
| Value Object | `DecisiónDeTraslado` | Decisión sobre destino hospitalario, nivel de urgencia y modo de traslado. |
| Value Object | `EvaluaciónClínica` | Resumen estructurado del estado clínico del paciente al finalizar la evaluación en campo. |
| Value Object | `CondiciónDelPaciente` | Estado clínico en un momento dado: `ESTABLE`, `CRÍTICO`, `MEJORANDO`, `DETERIORANDO`. |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Evaluación Prehospitalaria | Evaluación médica completa realizada por el paramédico en la escena de la emergencia. |
| Signos Vitales | Signos vitales medidos en escena: presión arterial, pulso, saturación de oxígeno, etc. |
| Re-Triaje | Nueva clasificación de prioridad basada en la evaluación presencial del paramédico. |
| Tratamiento | Intervención médica específica aplicada al paciente en campo por el paramédico. |
| Decisión de Traslado | Decisión clínica sobre el traslado del paciente: tipo de hospital, urgencia y modo. |
| Evaluación Clínica | Resumen estructurado del estado clínico del paciente tras la evaluación en campo. |
| Condición del Paciente | Estado clínico del paciente en un momento dado: ESTABLE, CRÍTICO, MEJORANDO, DETERIORANDO. |

---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `EvaluaciónIniciada` | Se emite cuando el paramédico comienza la evaluación en la escena del paciente. | Este contexto | Respuesta a Emergencias |
| `SignosVitalesRegistrados` | Se emite cada vez que el paramédico registra una nueva toma de signos vitales. | Este contexto | Integración Sanitaria |
| `ReTriajeRealizado` | Se emite cuando el paramédico reclasifica la prioridad del paciente en campo. | Este contexto | Respuesta a Emergencias, Despacho y Enrutamiento |
| `TratamientoAplicado` | Se emite cuando se registra una intervención médica sobre el paciente. | Este contexto | Cumplimiento y Legal |
| `DecisiónDeTraslado` | Se emite cuando el paramédico define el centro sanitario destino y el modo de traslado. | Este contexto | Integración Sanitaria, Despacho y Enrutamiento |
| `EvaluaciónFinalizada` | Se emite cuando el paramédico completa la evaluación y el paciente está listo para traslado. | Este contexto | Respuesta a Emergencias, Analítica y Reportes |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Publica cambios de prioridad y condición del paciente al caso activo. |
| Despacho y Enrutamiento | **Upstream (Proveedor)** | Publica la decisión de traslado para ajustar la ruta hacia el hospital destino. |
| Integración de salud | **Upstream (Proveedor)** | Publica signos vitales y decisión de traslado para seleccionar el centro de salud adecuado. |
| Cumplimiento y Legal | **Downstream (Cliente)** | Registra en auditoría cada tratamiento aplicado al paciente en campo. |
| Analítica y Reportes | **Downstream (Cliente)** | Consume evaluaciones finalizadas para estadísticas de tipos de intervención y condición clínica. |

---

## 4. Contexto de Gestión de unidad de emergencia

**Tipo:** `SUPPORTING`

### Responsabilidad

Administrar el inventario operativo del sistema: ambulancias, paramédicos y equipamiento. Es la fuente de verdad sobre la disponibilidad de recursos en tiempo real. Gestiona el estado operativo de cada unidad, garantizando que el contexto de Despacho siempre tenga información precisa sobre lo que está disponible.

---

### Actores

| Actor | Rol |
|---|---|
| Administrador | Registra y actualiza información de ambulancias, paramédicos y equipamiento. |
| Sistema SIE | Actualiza automáticamente el estado de los recursos conforme avanzan las emergencias. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Aggregate Root | `Ambulancia` | Vehículo de emergencia con su información técnica, estado y tripulación asignada. |
| Aggregate Root | `Paramédico` | Profesional certificado con sus datos, certificaciones y estado de disponibilidad. |
| Entity | `MiembroDeTripulación` | Paramédico asignado a un turno activo en una ambulancia específica. |
| Value Object | `InformaciónDelVehículo` | Datos técnicos de la ambulancia: placa, tipo, capacidad y equipamiento. |
| Value Object | `EstadoDeDisponibilidad` | Estado operativo del recurso: `DISPONIBLE`, `ASIGNADO`, `EN_ESCENA`, `TRANSPORTANDO`, `FUERA_DE_SERVICIO`. |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Ambulancia | Vehículo de emergencia equipado y certificado para atención prehospitalaria. |
| Paramédico | Profesional certificado en atención prehospitalaria asignado a una ambulancia. |
| Estado de Disponibilidad | Estado operativo del recurso: DISPONIBLE, ASIGNADO, EN_ESCENA, TRANSPORTANDO, FUERA_DE_SERVICIO. |
| Miembro de Tripulación | Integrante de la tripulación de una ambulancia durante un turno activo. |
---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `UnidadDisponible` | Se emite cuando una ambulancia y tripulación quedan libres para ser asignadas. | Este contexto | Despacho y Enrutamiento |
| `EstadoDeUnidadActualizado` | Se emite cuando el estado operativo de una ambulancia cambia (ej. pasa a EN_ESCENA). | Este contexto | Despacho y Enrutamiento |
| `AmbulanciaFueraDeServicio` | Se emite cuando una ambulancia queda inoperativa por mantenimiento o falla. | Este contexto | Despacho y Enrutamiento, Analítica y Reportes |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Despacho y Enrutamiento | **Upstream (Proveedor)** | Provee el inventario de recursos disponibles y actualiza su estado tras cada asignación. |
| Analítica y Reportes | **Downstream (Cliente)** | Provee datos de utilización de recursos, disponibilidad histórica y rotación de turnos. |

---

## 5. Contexto de Integración de salud

**Tipo:** `SUPPORTING` 

### Responsabilidad

Gestionar la comunicación entre el SIE y los centros de salud para verificar la capacidad disponible y coordinar la recepción del paciente según el servicio especializado que requiere. Garantiza que el centro sanitario seleccionado cuente con los recursos necesarios antes de que la ambulancia llegue, reduciendo los tiempos de espera y optimizando la derivación.

---

### Actores

| Actor | Rol |
|---|---|
| Centro de salud | Publica su capacidad actual y disponibilidad de servicios especializados. |
| Sistema SIE | Consulta la capacidad disponible y selecciona el centro sanitario más adecuado para el paciente. |
| Paramédico | Informa desde campo el estado clínico que determina el servicio sanitario requerido. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Aggregate Root | `CentroDeSalud` | Entidad que representa un centro de salud con su información, capacidad y servicios disponibles. |
| Value Object | `CapacidadDeAtencion` | Estado actual de ocupación del centro por área o servicio, en tiempo real. |
| Value Object | `InformaciónDelCentro` | Datos descriptivos del centro sanitario: nombre, ubicación, nivel de complejidad y especialidades. |
| Value Object | `DisponibilidadDeCamas` | Número de camas libres por servicio específico (UCI, Urgencias, Trauma, etc.). |
| Value Object | `ServicioEspecializado` | Servicio médico especializado disponible: UCI, Trauma, Quemados, Neonatología, etc. |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Capacidad de atencion| Capacidad actual del centro sanitario para recibir nuevos pacientes en sus distintas áreas. |
| Centro de Salud | Centro de salud registrado en el sistema con capacidad, servicios y ubicación definidos. |
| Servicio Especializado | Servicio médico especializado disponible en el centro sanitario: UCI, Trauma, Quemados, etc. |
| Disponibilidad de Camas | Número de camas disponibles en un servicio específico del centro sanitario en tiempo real. |
| Información del Centro | Información descriptiva del centro sanitario: nombre, ubicación, nivel de complejidad y servicios. |

---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `CapacidadDeAtencionActualizada` | Se emite cuando un centro sanitario publica un cambio en su disponibilidad de camas o servicios. | Centro de salud (externo) | Este contexto |
| `CentroDeSaludSeleccionado` | Se emite cuando el SIE determina el centro de salud más adecuado para el paciente según su condición y la disponibilidad. | Este contexto | Despacho y Enrutamiento, Atención Prehospitalaria |
| `PacienteEntregado` | Se emite cuando el paramédico confirma la entrega del paciente al centro sanitario destino. | Este contexto | Respuesta a Emergencias, Analítica y Reportes |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Despacho y Enrutamiento | **Upstream (Proveedor)** | Recibe `FaseDeCambioDeRuta` para iniciar la consulta de capacidad en centros de salud. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Recibe signos vitales y decisión de traslado para seleccionar el servicio de salud adecuado. |
| Respuesta a Emergencias | **Upstream (Proveedor)** | Publica `PacienteEntregado` para cerrar el ciclo del caso de emergencia. |
| Analítica y Reportes | **Downstream (Cliente)** | Provee datos de ocupación del centro de salud, tiempos de derivación y disponibilidad por centro. |
| Cumplimiento y Legal | **Downstream (Cliente)** | Registra en auditoría las derivaciones realizadas y las respuestas de los centros de salud. |

---

## 6. Contexto de Analítica y Reportes

**Tipo:** `SUPPORTING` 

### Responsabilidad

Consolidar, procesar y analizar los datos históricos del sistema para generar indicadores de desempeño, reportes periódicos y visualizaciones geográficas. Opera exclusivamente con datos anonimizados para proteger la privacidad de los pacientes. Apoya la toma de decisiones estratégicas y la mejora continua del servicio.

---

### Actores

| Actor | Rol |
|---|---|
| Analista | Consulta reportes, configura métricas y exporta datos para análisis externo. |
| Tomador de decisión | Consume dashboards e indicadores para decisiones operativas y estratégicas. |
| Sistema SIE | Alimenta automáticamente el contexto con eventos de todos los bounded contexts. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Value Object | `RegistroAnonimizado` | Snapshot de una emergencia con datos personales eliminados o enmascarados. |
| Value Object | `MétricasDeDesempeño` | Indicadores operativos: tiempo promedio de respuesta, tasa de éxito, cobertura geográfica. |
| Value Object | `MapaDeCalor` | Visualización geográfica de la densidad de emergencias por zona y período. |
| Value Object | `ProyecciónDeIncidentes` | Estimación estadística del volumen de emergencias esperadas en un período futuro. |
| Value Object | `Reporte` | Documento generado automáticamente con análisis agregado para un período definido. |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Mapa de Calor | Visualización geográfica de zonas con mayor incidencia de emergencias en un período. |
| Registro Anonimizado | Registro de emergencia con datos personales eliminados o enmascarados para análisis. |
| Métricas de Desempeño | Indicadores de desempeño del sistema: tiempos de respuesta, tasa de éxito, cobertura. |
| Proyección de Incidentes | Proyección estadística del volumen y tipo de emergencias esperadas en un período futuro. |
| Reporte | Documento generado automáticamente con análisis agregado de emergencias en un período. |

---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `ReporteGenerado` | Se emite cuando el sistema crea automáticamente un reporte periódico (diario, semanal, mensual). | Este contexto | Soporte al Usuario, Cumplimiento y Legal |
| `MétricaCalculada` | Se emite cuando se recalcula un indicador de desempeño tras procesar nuevos eventos. | Este contexto | — (consumo interno / dashboards) |
| `AlertaDeDesempeño` | Se emite cuando una métrica supera un umbral crítico (ej. tiempo de respuesta excesivo). | Este contexto | Respuesta a Emergencias (notificación operativa) |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Consume eventos de creación, cierre y cancelación de casos. |
| Despacho y Enrutamiento | **Upstream (Proveedor)** | Consume tiempos de asignación, ruta y despacho para métricas operativas. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Consume evaluaciones finalizadas para análisis de intervenciones clínicas. |
| Gestión de Recursos | **Upstream (Proveedor)** | Consume datos de disponibilidad y utilización de ambulancias y paramédicos. |
| Integración Sanitaria | **Upstream (Proveedor)** | Consume datos de derivaciones, capacidad sanitaria y tiempos de entrega por centro. |
| Cumplimiento y Legal | **Downstream (Cliente)** | Provee reportes consolidados para cumplimiento normativo y auditoría regulatoria. |

---

## 7. Contexto de Soporte al Usuario

**Tipo:** `GENERIC` 

### Responsabilidad

Gestionar las solicitudes de soporte, quejas, reclamos y sugerencias (PQRS) de los usuarios del sistema. Centraliza la comunicación postventa y operativa, haciendo seguimiento a cada caso hasta su resolución. También recopila retroalimentación voluntaria para alimentar mejoras en el servicio.

---

### Actores

| Actor | Rol |
|---|---|
| Usuario del sistema | Ciudadanos, paramédicos u operadores que reportan problemas o envían retroalimentación. |
| Agente de soporte | Gestiona los tickets, investiga los casos y entrega resoluciones al usuario. |
| Sistema SIE | Puede generar tickets automáticamente ante fallas detectadas en el sistema. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Aggregate Root | `TicketDeSoporte` | Caso de soporte abierto con estado, historial de mensajes y resolución final. |
| Aggregate Root | `Queja` | Queja formal sobre el servicio recibido, que requiere investigación y respuesta oficial. |
| Entity | `Mensaje` | Comunicación individual dentro de un ticket, enviada por el usuario o el agente. |
| Value Object | `Resolución` | Resultado final del ticket: solución aplicada, estado de cierre y satisfacción del usuario. |
| Value Object | `Evidencia` | Archivos adjuntos o pruebas aportadas por el usuario para sustentar su caso. |
| Value Object | `RetroalimentaciónDelUsuario` | Valoración voluntaria del usuario sobre la calidad del servicio recibido. |
| Value Object | `Sugerencia` | Propuesta de mejora enviada por un usuario sobre procesos, herramientas o atención. |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Ticket de Soporte | Caso de soporte abierto por un usuario para reportar un problema o solicitar ayuda. |
| Queja | Queja formal de un usuario sobre el servicio recibido, que requiere seguimiento. |
| PQRS | Clasificación de solicitudes: Petición, Queja, Reclamo o Sugerencia del usuario. |
| Resolución | Resultado final de la atención de un Ticket de Soporte: solución aplicada y estado. |
| Retroalimentación del Usuario | Retroalimentación voluntaria del usuario sobre su experiencia con el servicio. |
| Evidencia | Archivos adjuntos o pruebas aportadas por el usuario para sustentar una queja. |

---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `TicketCreado` | Se emite cuando un usuario abre un nuevo caso de soporte o PQRS. | Este contexto | Cumplimiento y Legal |
| `QuejaEscalada` | Se emite cuando una queja supera el tiempo de respuesta esperado sin resolución. | Este contexto | Cumplimiento y Legal |
| `TicketResuelto` | Se emite cuando el agente cierra formalmente el ticket con una resolución. | Este contexto | Analítica y Reportes |
| `RetroalimentaciónRecibida` | Se emite cuando un usuario envía una valoración voluntaria del servicio. | Este contexto | Analítica y Reportes |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Analítica y Reportes | **Upstream (Proveedor)** | Recibe reportes del sistema para responder consultas técnicas de usuarios. |
| Cumplimiento y Legal | **Downstream (Cliente)** | Notifica tickets creados y quejas escaladas para registro y seguimiento legal. |

---

## 8. Contexto de Cumplimiento y Legal

**Tipo:** `SUPPORTING` 

### Responsabilidad

Garantizar que el sistema opere dentro del marco normativo aplicable, gestionando auditorías, contratos con terceros y reportes regulatorios. Centraliza el registro inmutable de acciones críticas del sistema, sirve como fuente de verdad ante organismos reguladores y asegura que todos los contratos con hospitales y proveedores estén vigentes y sean auditables.

---

### Actores

| Actor | Rol |
|---|---|
| Auditor interno | Revisa los registros de auditoría y genera reportes de cumplimiento periódicos. |
| Regulador externo | Organismo gubernamental que solicita reportes y verifica el cumplimiento normativo. |
| Departamento legal | Gestiona los contratos con hospitales y proveedores, y atiende requerimientos legales. |
| Sistema SIE | Alimenta automáticamente el registro de auditoría con eventos críticos de todos los contextos. |

---

### Entidades y Agregados

| Tipo | Nombre | Descripción |
|---|---|---|
| Aggregate Root | `RegistroDeAuditoría` | Entrada inmutable que documenta una acción crítica: quién, qué, cuándo y con qué resultado. |
| Aggregate Root | `ReporteRegulatorio` | Informe estructurado generado para cumplir con requerimientos de organismos reguladores. |
| Aggregate Root | `Contrato` | Acuerdo formal con un hospital o proveedor, con términos, vigencia y estado de cumplimiento. |
| Value Object | `IndicadorDeCumplimiento` | Señal que marca una posible violación o riesgo de incumplimiento normativo detectado. |
| Value Object | `ReglaDeCumplimiento` | Regla normativa configurada en el sistema que debe verificarse en las operaciones. |
| Value Object | `DocumentoLegal` | Archivo legal asociado a un contrato, auditoría o proceso regulatorio. |
| Value Object | `TérminosDelContrato` | Condiciones acordadas en un contrato: alcance, duración, SLAs y penalizaciones. |

---

### Lenguaje Ubicuo

| Término | Definición |
|---|---|
| Registro de Auditoría | Registro inmutable de acciones realizadas en el sistema con actor, fecha y resultado. |
| Reporte Regulatorio | Informe generado para cumplir con requerimientos normativos de organismos reguladores. |
| Contrato | Acuerdo formal con un tercero (hospital, proveedor) con términos y vigencia definidos. |
| Indicador de Cumplimiento | Indicador que señala una posible violación o riesgo de incumplimiento normativo. |
| Regla de Cumplimiento | Regla normativa configurada en el sistema que debe cumplirse en las operaciones. |
| Documento Legal | Documento legal asociado a un contrato, auditoría o proceso regulatorio del sistema. |

---

### Eventos de Dominio

| Evento | Descripción | Lo produce | Lo consume |
|---|---|---|---|
| `AcciónAuditada` | Se emite cuando el sistema registra una acción crítica en el log de auditoría. | Este contexto | — (registro interno inmutable) |
| `ViolacióNNormativaDetectada` | Se emite cuando una regla de cumplimiento es infringida en cualquier contexto. | Este contexto | Soporte al Usuario, tomadores de decisión |
| `ContratoVencido` | Se emite cuando un contrato con un centro sanitario o proveedor llega a su fecha de vencimiento. | Este contexto | Integración Sanitaria, Gestión de Recursos |
| `ReporteRegulatorioGenerado` | Se emite cuando se produce un reporte formal para un organismo regulador. | Este contexto | — (entrega externa) |
| `CertificaciónVencidaRegistrada` | Se emite cuando se audita el vencimiento de certificación de un paramédico. | Este contexto | Gestión de Recursos |

---

### Relaciones con otros contextos

| Contexto relacionado | Tipo de relación | Descripción |
|---|---|---|
| Respuesta a Emergencias | **Upstream (Proveedor)** | Consume eventos de cierre y cancelación de casos para registro de auditoría. |
| Atención Prehospitalaria | **Upstream (Proveedor)** | Consume eventos de tratamientos aplicados para auditoría clínica. |
| Gestión de Recursos | **Upstream (Proveedor)** | Consume alertas de certificaciones vencidas para registro y seguimiento normativo. |
| Integración Sanitaria | **Upstream (Proveedor)** | Consume derivaciones realizadas y respuestas de centros sanitarios para auditoría. |
| Analítica y Reportes | **Upstream (Proveedor)** | Consume reportes consolidados para elaborar reportes regulatorios. |
| Soporte al Usuario | **Upstream (Proveedor)** | Consume tickets y quejas escaladas para seguimiento legal cuando corresponda. |

---


