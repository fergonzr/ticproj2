# Historias de Usuario para ROL: Operador

---

## HU-O001: Visualización de Estado de Recursos al Inicio de Turno

**Descripción:**
Yo como operador de emergencias al iniciar mi turno, necesito visualizar un dashboard con el estado actual de ambulancias disponibles con la finalidad de comenzar mi jornada con claridad sobre los recursos operativos sin depender de reportes verbales del turno anterior.

**Criterios de Aceptación:**
1. El dashboard debe mostrar número de ambulancias disponibles, en ruta y fuera de servicio
2. La información debe cargarse en menos de X segundos al iniciar sesión
3. Debe existir indicador visual de alertas activas pendientes de selección
4. El estado debe actualizarse automáticamente cada X segundos sin recargar la página

---

## HU-O002: Recepción de Alerta con Datos Estructurados

**Descripción:**
Yo como operador recibiendo una emergencia, necesito que la alerta llegue con datos estructurados (ubicación, datos del paciente) en lugar de solo una llamada de voz, con la finalidad de reducir la ambigüedad y el tiempo de recolección de información crítica.

**Criterios de Aceptación:**
1. La alerta debe mostrar ubicación georreferenciada en mapa con precisión mínima de 10 metros
2. Debe mostrar datos médicos pre-registrados si están disponibles (alergias, condiciones)
3. Debe completarse los datos con la llamada de voz 
4. La alerta debe poder clasificarse por nivel de prioridad

---

## HU-O003: Interfaz de Triaje Telefónico Asistido

**Descripción:**
Yo como operador realizando triaje telefónico, necesito una interfaz guiada con preguntas estructuradas y códigos de color según gravedad, con la finalidad de estandarizar la evaluación inicial y reducir la carga cognitiva en situaciones de alta presión.

**Criterios de Aceptación:**
1. La interfaz debe presentar preguntas secuenciales organizadas
2. Debe asignar código de color automático (rojo, amarillo, verde) según respuestas del llamante
3. Debe permitir completar el triaje en menos de 3 minutos para casos estándar
4. Debe existir opción de saltar preguntas no aplicables con justificación breve
5. El resultado del triaje debe quedar registrado y visible

---

## HU-O004: Sugerencia de Asignación de Paramédico 

**Descripción:**
Yo como operador gestionando una emergencia, necesito visualizar una lista de paramédicos disponibles ordenada automáticamente por proximidad al lugar del accidente con opciones de filtrado por disponibilidad y compatibilidad, con la finalidad de tomar decisiones más rápidas y basadas en datos objetivos.

**Criterios de Aceptación:**
1. La lista debe ordenar paramédicos por tiempo estimado de llegada al lugar del evento
2. Debe indicar estado actual de cada paramédico (disponible, en ruta, en escena)
3. Debe actualizarse la lista en tiempo real cada X minutos reflejando cambios de estado o ubicación 
4. Debe permitir seleccionar manualmente un paramédico diferente al sugerido con justificación
5. La acción debe notificarse automáticamente al paramédico seleccionado 
6. Debe permitir ordenamiento alternativo por: tiempo de disponibilidad más largo, mayor cercanía a hospital, o preferencia manual del operador (opcional)

---

## HU-O005: Monitoreo en Tiempo Real de la Ambulancia 

**Descripción:**
Yo como operador durante la atención, necesito visualizar en un mapa la ubicación en tiempo real de la ambulancia asignada con su ETA actualizado, con la finalidad de hacer seguimiento sin necesidad de contactar constantemente por radio al paramédico.

**Criterios de Aceptación:**
1. El mapa debe mostrar ubicación de la ambulancia actualizada cada X minutos
2. Debe mostrar ETA calculado
3. Debe indicar estado actual del paramédico (en ruta, en escena, en traslado, entregado)

---

## HU-O006: Confirmación de Selección de Recurso y Notificación a Actores

**Descripción:**
Yo como operador confirmando la selección de un paramédico, necesito un punto único que notifique simultáneamente al paramédico seleccionado y registre la selección en el sistema, con la finalidad de eliminar llamadas redundantes y garantizar que todos los actores reciban la misma información simultáneamente.

**Criterios de Aceptación:**
1. El punto debe enviar notificación push al paramédico con todos los datos del caso
2. Debe registrar timestamp exacto de la asignación para métricas de tiempo de respuesta
3. Debe cambiar el estado del caso automáticamente a recurso asignado tras confirmación
4. Debe permitir reasignación rápida si el primer paramédico no confirma en tiempo límite
5. Debe enviar alerta al hospital destino con resumen del caso y ETA estimado (opcional)

---

## HU-O007: Cierre de Caso con Confirmación del Paramédico

**Descripción:**
Yo como operador finalizando una emergencia, necesito recibir confirmación automática del paramédico cuando el caso se cierra (paciente entregado), con la finalidad de liberar recursos para nuevas asignaciones y completar el registro del caso sin seguimiento manual.

**Criterios de Aceptación:**
1. El cierre debe activarse automáticamente cuando el paramédico confirma entrega en hospital
2. Debe mostrar resumen final del caso (tiempos, hospital destino, paramédico asignado)
3. Debe liberar automáticamente al paramédico como "disponible" para nuevas asignaciones
4. Debe notificar al operador si el paramédico no confirma cierre en tiempo esperado
5. Debe permitir al operador forzar cierre manual con justificación 

---

## HU-O008: Dashboard de Análisis Histórico para Mejora Continua

**Descripción:**
Yo como operador al final de mi turno o período, necesito acceder a un dashboard con métricas de desempeño y patrones de emergencias, con la finalidad de entender mi rendimiento, identificar áreas de mejora y contribuir a la planificación estratégica del servicio.

**Criterios de Aceptación:**
1. El dashboard debe mostrar tiempos promedio de respuesta y patrones temporales 
2. Debe identificar zonas de alta incidencia de emergencias mediante mapa de calor
3. Los datos deben estar anonimizados para análisis agregado sin exposición individual
4. Debe permitir exportar reportes en formato PDF para revisión con supervisores (opcional)

---

