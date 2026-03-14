# Lenguaje Ubicuo
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

## 1. Contexto de Respuesta a Emergencias

| Término | Definición |
|---|---|
| Caso de Emergencia | Instancia completa de una emergencia desde el reporte inicial hasta el cierre formal del caso. |
| Alerta | Notificación inicial recibida por el sistema que activa el proceso de atención de emergencia. |
| Triaje | Evaluación y clasificación de la severidad del paciente realizada por el operador al momento de recibir la alerta. |
| Nivel de Prioridad | Nivel de urgencia asignado al caso: `CRITICO` (rojo), `URGENTE` (amarillo), `NO_URGENTE` (verde). |
| Estado de Emergencia | Enumeración que representa la etapa actual en el ciclo de vida de un `CasoDeEmergencia`. Determina qué acciones son válidas sobre el caso y refleja qué eventos han ocurrido. Las transiciones siguen un orden definido y están controladas exclusivamente por este contexto. Flujo: `RECIBIDO` → `EN_ESPERA_DE_ASIGNACION` → `ASIGNADO` → `ATENDIDO_EN_SITIO` → `EN_TRASLADO` → `CERRADO`. En cualquier punto anterior al despacho puede transicionar a `CANCELADO`. |
| Línea de Tiempo | Registro cronológico de todos los eventos y cambios de estado ocurridos en el caso. |
| Número de Radicado | Identificador único asignado al caso de emergencia para su trazabilidad. |
| Información Médica | Datos básicos de salud del ciudadano reportante relevantes para la atención inicial. |

### Estados de Emergencia

| Estado | Significado |
|---|---|
| `RECIBIDO` | El sistema ha registrado la alerta inicial y creado el caso de emergencia. El operador aún no ha completado el triaje ni iniciado la asignación de recursos. |
| `EN_ESPERA_DE_ASIGNACION` | El triaje ha sido realizado y el caso está en cola para que se le asigne un paramédico disponible. No hay paramédico vinculado aún. |
| `ASIGNADO` | Un paramédico ha sido formalmente asignado al caso y ha confirmado la aceptación. Se encuentra en tránsito hacia el lugar del incidente. |
| `ATENDIDO_EN_SITIO` | El paramédico llegó al lugar del incidente y está brindando atención prehospitalaria al paciente. Aún no se ha determinado si requiere traslado. |
| `EN_TRASLADO` | Se ha asignado un centro médico de destino y el paciente está siendo transportado activamente hacia él. |
| `CERRADO` | El caso ha concluido formalmente: el paciente fue entregado al centro médico o la situación fue resuelta en sitio. No se permiten más modificaciones. |
| `CANCELADO` | El caso fue cancelado antes del despacho del paramédico (ej. falsa alarma, ciudadano no localizado, error de reporte). No se permiten más modificaciones. |

---

## 2. Contexto de Asignación de Paramédico

| Término | Definición |
|---|---|
| Caso de Emergencia | Representación local de la emergencia activa que requiere asignación de un paramédico. |
| Paramédico Disponible | Paramédico elegible para ser asignado a una emergencia, con ubicación conocida y estado `DISPONIBLE`. |
| Asignación | Acto formal de vincular un paramédico específico a un caso de emergencia activo. |
| Estado de Emergencia | Estado del caso en este contexto: `EN_ESPERA_DE_ASIGNACION`, `ASIGNADO`, `CANCELADO`. |
| Recomendación | Lista ordenada de paramédicos elegibles generada automáticamente por el sistema según proximidad y disponibilidad. |

---

## 3. Contexto de Asignación de Centros Médicos

| Término | Definición |
|---|---|
| Caso de Emergencia | Representación local del caso activo que requiere asignación de un centro médico para el traslado. |
| Centro Médico Disponible | Centro médico elegible para recibir al paciente: con capacidad, nivel de complejidad y especialidades adecuadas. |
| Asignación de Centro | Acto formal de vincular un centro médico específico como destino de traslado para la emergencia. |
| Estado de Emergencia | Estado del caso en este contexto: `ATENDIDO_EN_SITIO`, `EN_TRASLADO`. |
| Cambio de Centro | Solicitud del paramédico para reasignar el destino del traslado durante la atención. |

---

## 4. Contexto de Enrutamiento

| Término | Definición |
|---|---|
| Ruta | Camino calculado para el traslado, con origen, waypoints y destino final. Contiene segmentos y ETA. |
| Segmento de Ruta | Tramo individual de la ruta con distancia, duración estimada y estado de completitud. |
| Tiempo Estimado de Llegada (ETA) | Estimación dinámica del tiempo de llegada al destino activo, recalculada en tiempo real. |
| Fase de Ruta | Etapa activa del recorrido: `HACIA_PACIENTE` (de la base al incidente) o `HACIA_HOSPITAL` (del incidente al hospital). |
| Paramédico Asignado | Referencia al paramédico vinculado a la ruta activa, utilizado para obtener su posición actual. |

---

## 5. Contexto de Localización del Recurso

| Término | Definición |
|---|---|
| Recurso | Paramédico registrado en el sistema cuya posición geográfica es rastreada en tiempo real mientras tiene sesión activa en la aplicación. |
| Ubicación | Posición geográfica actual del recurso expresada en coordenadas GPS. |
| Estado de Disponibilidad | Indicador del recurso: `DISPONIBLE` (sesión activa, GPS encendido) o `NO_DISPONIBLE` (sesión cerrada, GPS apagado). |
| Sesión Activa | Estado en que el paramédico ha iniciado sesión en la aplicación y su localización está siendo rastreada en tiempo real. |
| Sesión Cerrada | Estado en que el paramédico ha cerrado sesión o salido de la aplicación, deteniendo el rastreo de su posición. |

---

## 6. Contexto de Manejo de Usuarios

| Término | Definición |
|---|---|
| Usuario | Persona registrada en el sistema con un rol asignado: Paramédico, Operador o Analista. |
| Paramédico | Usuario con rol operativo que atiende emergencias en campo. |
| Operador | Usuario con rol de centro de mando que gestiona casos de emergencia y asignaciones. |
| Analista | Usuario con rol analítico que consulta reportes y métricas del sistema. |
| Rol | Clasificación funcional del usuario que determina sus permisos y responsabilidades en el sistema. |
| Recurso Operativo | Perfil operativo de un usuario (específicamente un paramédico) referenciado por otros contextos para asignación. |

---

## 7. Contexto de Atención Prehospitalaria

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

---

## 8. Contexto de Centros Médicos

| Término | Definición |
|---|---|
| Centro Médico | Institución de salud registrada en el sistema que puede recibir pacientes trasladados por emergencias. |
| Capacidad | Estado actual de ocupación del centro: número de camas libres por servicio en tiempo real. |
| Nivel de Complejidad | Clasificación del centro según su capacidad de atención: `BÁSICO`, `INTERMEDIO`, `ALTO`. |
| Disponibilidad de Camas | Número de camas libres por servicio específico (UCI, Urgencias, Trauma, etc.) en un momento dado. |
| Servicio Especializado | Servicio médico de alta complejidad disponible en el centro: UCI, Trauma, Quemados, Neonatología, etc. |
| Entrega de Paciente | Acto de transferencia formal del paciente al centro médico por parte del paramédico. |

---

## 9. Contexto de Analítica

| Término | Definición |
|---|---|
| Reporte | Documento generado automáticamente con análisis agregado de emergencias en un período de tiempo. |
| Mapa de Calor | Visualización geográfica de zonas con mayor incidencia de emergencias en un período determinado. |
| Registro Anonimizado | Registro de emergencia con datos personales eliminados o enmascarados para su uso en análisis estadístico. |
| Métricas de Desempeño | Indicadores clave del sistema: tiempos de respuesta promedio, tasa de resolución, cobertura geográfica. |
| Alerta de Desempeño | Notificación generada automáticamente cuando una métrica supera un umbral crítico configurado. |

---

## 10. Contexto de Responsabilidad Legal

| Término | Definición |
|---|---|
| Registro de Auditoría | Entrada inmutable que documenta una acción crítica del sistema: quién la ejecutó, qué hizo, cuándo y con qué resultado. |
| Reporte Regulatorio | Informe generado para cumplir con requerimientos normativos de organismos reguladores. |
| Indicador de Cumplimiento | Señal que identifica una posible violación o riesgo de incumplimiento normativo detectado en el sistema. |
| Regla de Cumplimiento | Regla normativa configurada en el sistema que debe verificarse en las operaciones del servicio. |
| Número de Radicado | Identificador único asignado al caso de emergencia, entregado al ciudadano como constancia de recepción. |
| Documento Legal | Documento formal asociado a un proceso de auditoría o regulatorio del sistema. |

---

## 11. Contexto de Soporte al Usuario

| Término | Definición |
|---|---|
| Ticket de Soporte | Caso de soporte abierto por un usuario para reportar un problema o solicitar ayuda, con historial y resolución. |
| Queja | Solicitud formal de un usuario sobre el servicio recibido, que requiere investigación y respuesta oficial. |
| PQRS | Clasificación de solicitudes de usuarios: Petición, Queja, Reclamo o Sugerencia. |
| Resolución | Resultado final de la atención de un Ticket de Soporte: solución aplicada, estado de cierre y nivel de satisfacción. |
| Escalamiento | Proceso de elevar una queja a instancias superiores cuando supera el tiempo de respuesta sin resolución. |
| Retroalimentación del Usuario | Valoración voluntaria del usuario sobre su experiencia con el servicio de atención de emergencias. |
| Evidencia | Archivos adjuntos o pruebas aportadas por el usuario para sustentar su queja o reclamo. |
