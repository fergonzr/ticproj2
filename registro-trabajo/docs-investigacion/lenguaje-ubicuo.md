# Lenguaje Ubicuo

## Contexto de Respuesta a Emergencias

| Término | Definición |
|---|---|
| Caso de Emergencia | Instancia completa de una emergencia desde el reporte inicial hasta el cierre del caso. |
| Alerta | Notificación inicial recibida por el sistema que activa el proceso de atención. |
| Triaje | Evaluación y clasificación de la severidad del paciente realizada por el operador. |
| Nivel de Prioridad | Nivel de urgencia asignado al caso: ROJO (crítico), AMARILLO (urgente), VERDE (no urgente). |
| Estado de Emergencia | Estado del ciclo de vida del caso: RECIBIDO, EN_PROCESO, DESPACHADO, CERRADO, CANCELADO. |
| Línea de Tiempo | Registro cronológico de todos los eventos y cambios de estado asociados a un caso. |
| Referencia del Ciudadano | Referencia anónima o identificada del ciudadano que reportó la emergencia. |

---

## Contexto de Despacho y Enrutamiento

| Término | Definición |
|---|---|
| Asignación de Despacho | Asignación formal de una ambulancia y tripulación a una emergencia específica. |
| Ruta | Camino calculado con origen, destino intermedio y destino final, incluyendo waypoints. |
| Tiempo Estimado de Llegada | Tiempo estimado de llegada al punto de destino activo, recalculado en tiempo real. |
| Fase de Ruta | Fase activa del recorrido: HACIA_PACIENTE (hacia el paciente) o HACIA_HOSPITAL (hacia el centro sanitario). |
| Geolocalización | Coordenadas geográficas (latitud/longitud) de un punto de interés en el recorrido. |
| Recurso Disponible | Recurso (ambulancia + tripulación) elegible para ser asignado a una emergencia. |
| Segmento de Ruta | Tramo individual del recorrido con distancia, duración y estado propio. |

---

## Contexto de Atención Prehospitalaria

| Término | Definición |
|---|---|
| Evaluación Prehospitalaria | Evaluación médica completa realizada por el paramédico en la escena de la emergencia. |
| Signos Vitales | Signos vitales medidos en escena: presión arterial, pulso, saturación de oxígeno, Glasgow, etc. |
| Re-Triaje | Nueva clasificación de prioridad basada en la evaluación presencial del paramédico en campo. |
| Tratamiento | Intervención médica específica aplicada al paciente en campo por el paramédico. |
| Decisión de Traslado | Decisión clínica sobre el traslado del paciente: tipo de centro sanitario, urgencia y modo. |
| Evaluación Clínica | Resumen estructurado del estado clínico del paciente tras la evaluación en campo. |
| Condición del Paciente | Estado clínico del paciente en un momento dado: ESTABLE, CRÍTICO, MEJORANDO, DETERIORANDO. |

---

## Contexto de Gestión de Recursos

| Término | Definición |
|---|---|
| Ambulancia | Vehículo de emergencia equipado y certificado para atención prehospitalaria. |
| Paramédico | Profesional certificado en atención prehospitalaria asignado a una ambulancia. |
| Turno | Turno de trabajo con ambulancia y tripulación asignada, con horario definido. |
| Estado de Disponibilidad | Estado operativo del recurso: DISPONIBLE, ASIGNADO, EN_ESCENA, TRANSPORTANDO, FUERA_DE_SERVICIO. |
| Miembro de Tripulación | Integrante de la tripulación de una ambulancia durante un turno activo. |
| Certificación | Credencial o habilitación profesional que posee un paramédico para ejercer. |
| Programación de Turnos | Programación de turnos de una ambulancia y su tripulación en un periodo de tiempo. |

---

## Contexto de Integración Sanitaria

| Término | Definición |
|---|---|
| Capacidad Sanitaria | Capacidad actual del centro sanitario para recibir nuevos pacientes en sus distintas áreas. |
| Centro Sanitario | Centro de salud registrado en el sistema con capacidad, servicios y ubicación definidos. |
| Servicio Especializado | Servicio médico especializado disponible en el centro sanitario: UCI, Trauma, Quemados, etc. |
| Disponibilidad de Camas | Número de camas disponibles en un servicio específico del centro sanitario en tiempo real. |
| Información del Centro | Información descriptiva del centro sanitario: nombre, ubicación, nivel de complejidad y servicios. |

---

## Contexto de Analítica y Reportes

| Término | Definición |
|---|---|
| Mapa de Calor | Visualización geográfica de zonas con mayor incidencia de emergencias en un período. |
| Registro Anonimizado | Registro de emergencia con datos personales eliminados o enmascarados para análisis. |
| Métricas de Desempeño | Indicadores de desempeño del sistema: tiempos de respuesta, tasa de éxito, cobertura. |
| Proyección de Incidentes | Proyección estadística del volumen y tipo de emergencias esperadas en un período futuro. |
| Reporte | Documento generado automáticamente con análisis agregado de emergencias en un período. |

---

## Contexto de Soporte al Usuario

| Término | Definición |
|---|---|
| Ticket de Soporte | Caso de soporte abierto por un usuario para reportar un problema o solicitar ayuda. |
| Queja | Queja formal de un usuario sobre el servicio recibido, que requiere seguimiento oficial. |
| PQRS | Clasificación de solicitudes del usuario: Petición, Queja, Reclamo o Sugerencia. |
| Resolución | Resultado final de la atención de un Ticket de Soporte: solución aplicada y estado de cierre. |
| Retroalimentación del Usuario | Valoración voluntaria del usuario sobre la calidad del servicio recibido. |
| Evidencia | Archivos adjuntos o pruebas aportadas por el usuario para sustentar una queja. |

---

## Contexto de Cumplimiento y Legal

| Término | Definición |
|---|---|
| Registro de Auditoría | Registro inmutable de acciones realizadas en el sistema con actor, fecha y resultado. |
| Reporte Regulatorio | Informe generado para cumplir con requerimientos normativos de organismos reguladores. |
| Contrato | Acuerdo formal con un tercero (centro sanitario, proveedor) con términos y vigencia definidos. |
| Indicador de Cumplimiento | Indicador que señala una posible violación o riesgo de incumplimiento normativo. |
| Regla de Cumplimiento | Regla normativa configurada en el sistema que debe cumplirse en las operaciones. |
| Documento Legal | Documento legal asociado a un contrato, auditoría o proceso regulatorio del sistema. |
