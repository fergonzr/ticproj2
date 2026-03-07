# Historias de Usuario para ROL: Paramédico 

---

## HU-P001: Recepción de Alerta de Emergencia

**Descripción:**
Yo como paramédico en servicio activo, necesito recibir notificaciones push claras cuando se presente una nueva emergencia, con la finalidad de movilizar mi unidad de inmediato y reducir el tiempo de respuesta inicial.

**Criterios de Aceptación:**
1. La notificación debe incluir ubicación general y triaje preliminar
2. Debe existir confirmación visual y sonora de recepción de la alerta
3. El paramédico debe poder aceptar la asignación con un solo toque desde la notificación
4. El sistema debe registrar el timestamp de aceptación para métricas internas
5. Debe existir opción para indicar "no disponible" con razón breve (opcional)

---

## HU-P002: Visualización de Ruta Asignada hacia el Paciente

**Descripción:**
Yo como paramédico en desplazamiento, necesito visualizar la ruta óptima calculada desde mi ubicación actual hasta el paciente, con la finalidad de llegar de manera eficiente sin depender de aplicaciones externas.

**Criterios de Aceptación:**
1. La ruta debe mostrarse en un mapa integrado dentro de la aplicación
2. Debe indicar tiempo estimado de llegada (ETA) 
3. El mapa debe destacar puntos de referencia cercanos al lugar del incidente
4. La interfaz debe ser legible sin distraer la conducción 
5. Debe permitir navegación paso a paso con indicaciones opcionales

---

## HU-P003: Registro Digital de Triaje Presencial

**Descripción:**
Yo como paramédico en el lugar del incidente, necesito registrar los signos vitales y evaluación clínica del paciente mediante formulario digital simplificado, con la finalidad de documentar el estado real y transmitirlo al operador y hospital destino.

**Criterios de Aceptación:**
1. El formulario debe completarse en menos de 3 minutos en condiciones normales
2. Debe permitir registro rápido mediante selección táctil o campos predefinidos
3. Deve perimitir incluir signos vitales tales como: presión arterial, frecuencia cardíaca, saturación de O2, nivel de conciencia

---

## HU-P004: Consulta de Información Preliminar del Caso

**Descripción:**
Yo como paramédico en ruta hacia el incidente, necesito acceder a la información preliminar registrada durante el triaje telefónico y registro médico del ciudadano, con la finalidad de preparar los insumos y equipos adecuados antes de llegar al lugar.

**Criterios de Aceptación:**
1. Debe mostrar síntomas reportados por el paciente o testigos
2. Debe indicar nivel de gravedad asignado (crítico, alto, medio)
3. Debe mostrar datos del accidentado si fueron registrados con anterioridad
4. Debe permitir marcar información como "verificada en terreno" o "difiere de lo reportado" (opcional)

---

## HU-P005: Registro de Intervenciones Realizadas

**Descripción:**
Yo como paramédico durante la atención, necesito registrar las intervenciones y tratamientos administrados al paciente, con la finalidad de generar un historial clínico prehospitalario (reporte) completo para el centro receptor.

**Criterios de Aceptación:**
1. Debe permitir registrar tiempo de la intervención
2. Debe incluir campo para observaciones libres en caso de procedimientos no estándar
3. Los registros deben asociarse al caso activo
4. Debe permitir adjuntar fotos de lesiones si el dispositivo lo permite (opcional)

---

## HU-P006: Visualización de Hospital Destino Asignado

**Descripción:**
Yo como paramédico con paciente estabilizado, necesito conocer el hospital destino asignado con su ubicación y ruta, con la finalidad de trasladar al paciente al centro correcto sin necesidad de comunicación verbal adicional.

**Criterios de Aceptación:**
1. Debe mostrar nombre y dirección del hospital asignado
2. Debe incluir ruta de navegación desde el lugar del incidente hasta el hospital
3. Debe indicar tiempo estimado de traslado 
4. Debe mostrar información básica del hospital (nivel de complejidad, especialidades disponibles - datos simulados)
5. Debe permitir solicitar confirmación de ruta alternativa solo en casos excepcionales (requiere aprobación del operador) (opcional)

---

## HU-P007: Actualización de Estado de Traslado

**Descripción:**
Yo como paramédico durante el traslado, necesito actualizar el estado del viaje (en ruta, llegando, demorado), con la finalidad de mantener informado al operador y al paciente sobre el progreso del traslado.

**Criterios de Aceptación:**
1. Debe ofrecer botones rápidos para cambios de estado comunes
2. Cada cambio de estado debe registrar timestamp automático
3. El operador y ciudadano deben recibir notificación inmediata del cambio de estado
4. Debe permitir agregar nota breve si hay demoras o incidencias en la ruta (opcional)

---

## HU-P008: Confirmación de Entrega de Paciente

**Descripción:**
Yo como paramédico al llegar al hospital, necesito confirmar la entrega formal del paciente al personal médico, con la finalidad de cerrar el caso en el sistema y quedar disponible para nuevas asignaciones.

**Criterios de Aceptación:**
1. Debe existir botón de "Confirmar Entrega" con validación de ubicación (geocerca del hospital)
2. Debe registrar hora exacta de entrega para cálculo de tiempos totales
3. El operador debe recibir notificación automática de cierre del caso
4. El paramédico debe quedar marcado como "disponible" automáticamente tras la confirmación

---

