# Lenguaje Ubicuo

## Contexto de Respuesta a Emergencias

| Término | Término (Inglés) | Definición |
|---|---|---|
| Caso de Emergencia | Emergency Case | Instancia completa de una emergencia desde el reporte inicial hasta el cierre del caso. |
| Alerta | Alert | Notificación inicial recibida por el sistema que activa el proceso de atención. |
| Triaje | Triage | Evaluación y clasificación de la severidad del paciente realizada por el operador. |
| Nivel de Prioridad | Priority Level | Nivel de urgencia asignado al caso: ROJO (crítico), AMARILLO (urgente), VERDE (no urgente). |
| Estado de Emergencia | Emergency Status | Estado del ciclo de vida del caso: RECIBIDO, EN_PROCESO, DESPACHADO, CERRADO, CANCELADO. |
| Línea de Tiempo | Timeline | Registro cronológico de todos los eventos y cambios de estado asociados a un caso. |
| Referencia del Ciudadano | Citizen Reference | Referencia anónima o identificada del ciudadano que reportó la emergencia. |

---

## Contexto de Despacho y Enrutamiento

| Término | Término (Inglés) | Definición |
|---|---|---|
| Asignación de Despacho | Dispatch Assignment | Asignación formal de una ambulancia y tripulación a una emergencia específica. |
| Ruta | Route | Camino calculado con origen, destino intermedio y destino final, incluyendo waypoints. |
| Tiempo Estimado de Llegada | Estimated Time of Arrival | Tiempo estimado de llegada al punto de destino activo, recalculado en tiempo real. |
| Fase de Ruta | Route Phase | Fase activa del recorrido: HACIA_PACIENTE (hacia el paciente) o HACIA_HOSPITAL (hacia el centro sanitario). |
| Geolocalización | Geolocation | Coordenadas geográficas (latitud/longitud) de un punto de interés en el recorrido. |
| Recurso Disponible | Available Resource | Recurso (ambulancia + tripulación) elegible para ser asignado a una emergencia. |
| Segmento de Ruta | Route Segment | Tramo individual del recorrido con distancia, duración y estado propio. |

---

## Contexto de Atención Prehospitalaria

| Término | Término (Inglés) | Definición |
|---|---|---|
| Evaluación Prehospitalaria | Prehospital Evaluation | Evaluación médica completa realizada por el paramédico en la escena de la emergencia. |
| Signos Vitales | Vital Signs | Signos vitales medidos en escena: presión arterial, pulso, saturación de oxígeno, Glasgow, etc. |
| Re-Triaje | Retriage | Nueva clasificación de prioridad basada en la evaluación presencial del paramédico en campo. |
| Tratamiento | Treatment | Intervención médica específica aplicada al paciente en campo por el paramédico. |
| Decisión de Traslado | Transfer Decision | Decisión clínica sobre el traslado del paciente: tipo de centro sanitario, urgencia y modo. |
| Evaluación Clínica | Clinical Evaluation | Resumen estructurado del estado clínico del paciente tras la evaluación en campo. |
| Condición del Paciente | Patient Condition | Estado clínico del paciente en un momento dado: ESTABLE, CRÍTICO, MEJORANDO, DETERIORANDO. |

---

## Contexto de Gestión de Recursos

| Término | Término (Inglés) | Definición |
|---|---|---|
| Ambulancia | Ambulance | Vehículo de emergencia equipado y certificado para atención prehospitalaria. |
| Paramédico | Paramedic | Profesional certificado en atención prehospitalaria asignado a una ambulancia. |
| Turno | Shift | Turno de trabajo con ambulancia y tripulación asignada, con horario definido. |
| Estado de Disponibilidad | Availability Status | Estado operativo del recurso: DISPONIBLE, ASIGNADO, EN_ESCENA, TRANSPORTANDO, FUERA_DE_SERVICIO. |
| Miembro de Tripulación | Crew Member | Integrante de la tripulación de una ambulancia durante un turno activo. |
| Certificación | Certification | Credencial o habilitación profesional que posee un paramédico para ejercer. |
| Programación de Turnos | Shift Schedule | Programación de turnos de una ambulancia y su tripulación en un periodo de tiempo. |

---

## Contexto de Integración Sanitaria

| Término | Término (Inglés) | Definición |
|---|---|---|
| Capacidad Sanitaria | Healthcare Capacity | Capacidad actual del centro sanitario para recibir nuevos pacientes en sus distintas áreas. |
| Centro Sanitario | Healthcare Center | Centro de salud registrado en el sistema con capacidad, servicios y ubicación definidos. |
| Servicio Especializado | Specialized Service | Servicio médico especializado disponible en el centro sanitario: UCI, Trauma, Quemados, etc. |
| Disponibilidad de Camas | Bed Availability | Número de camas disponibles en un servicio específico del centro sanitario en tiempo real. |
| Información del Centro | Center Information | Información descriptiva del centro sanitario: nombre, ubicación, nivel de complejidad y servicios. |

---

## Contexto de Analítica y Reportes

| Término | Término (Inglés) | Definición |
|---|---|---|
| Mapa de Calor | Heatmap | Visualización geográfica de zonas con mayor incidencia de emergencias en un período. |
| Registro Anonimizado | Anonymized Record | Registro de emergencia con datos personales eliminados o enmascarados para análisis. |
| Métricas de Desempeño | Performance Metrics | Indicadores de desempeño del sistema: tiempos de respuesta, tasa de éxito, cobertura. |
| Proyección de Incidentes | Incident Projection | Proyección estadística del volumen y tipo de emergencias esperadas en un período futuro. |
| Reporte | Report | Documento generado automáticamente con análisis agregado de emergencias en un período. |

---

## Contexto de Soporte al Usuario

| Término | Término (Inglés) | Definición |
|---|---|---|
| Ticket de Soporte | Support Ticket | Caso de soporte abierto por un usuario para reportar un problema o solicitar ayuda. |
| Queja | Complaint | Queja formal de un usuario sobre el servicio recibido, que requiere seguimiento oficial. |
| PQRS | PQRS | Clasificación de solicitudes del usuario: Petición, Queja, Reclamo o Sugerencia. |
| Resolución | Resolution | Resultado final de la atención de un Ticket de Soporte: solución aplicada y estado de cierre. |
| Retroalimentación del Usuario | User Feedback | Valoración voluntaria del usuario sobre la calidad del servicio recibido. |
| Evidencia | Evidence | Archivos adjuntos o pruebas aportadas por el usuario para sustentar una queja. |

---

## Contexto de Cumplimiento y Legal

| Término | Término (Inglés) | Definición |
|---|---|---|
| Registro de Auditoría | Audit Log | Registro inmutable de acciones realizadas en el sistema con actor, fecha y resultado. |
| Reporte Regulatorio | Regulatory Report | Informe generado para cumplir con requerimientos normativos de organismos reguladores. |
| Contrato | Contract | Acuerdo formal con un tercero (centro sanitario, proveedor) con términos y vigencia definidos. |
| Indicador de Cumplimiento | Compliance Indicator | Indicador que señala una posible violación o riesgo de incumplimiento normativo. |
| Regla de Cumplimiento | Compliance Rule | Regla normativa configurada en el sistema que debe cumplirse en las operaciones. |
| Documento Legal | Legal Document | Documento legal asociado a un contrato, auditoría o proceso regulatorio del sistema. |
