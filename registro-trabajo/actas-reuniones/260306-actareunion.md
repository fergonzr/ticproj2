# Acta de Reunión – Sincronización Técnica, Documentación y Planificación 

**Semestre:** 2026-1  
**Fecha:** 06/03/2026

## Asistentes del encuentro virtual
- Juan Esteban Páez Gil  
- Isabela Arrubla Orozco  
- Fernando González Rivero  
- Samuel Betancur Muñoz 

## Objetivos de la reunión

La reunión tuvo como propósito principal **actualizar al compañero del equipo respecto al estado actual del desarrollo frontend**, **revisar y organizar los próximos compromisos y entregas**, y **alinear el flujo de trabajo técnico** para garantizar una ejecución eficiente en las próximas semanas.

## Temas tratados

El equipo inició con una socialización del avance en el **frontend**, incluyendo la estructura de componentes iniciales, decisiones de UI/UX. Se acordó un **flujo de desarrollo iterativo y paralelo**: en cada ciclo de una semana, se desea trabajar simultáneamente en un *puerto* (definición clara de contrato de interfaz) y sus *adaptadores* correspondientes (implementación técnica), siguiendo el enfoque hexagonal propuesto.

Posteriormente, se realizó una revisión de todos los **issues etiquetados como `documentation`** en el repositorio. Se identificaron 6 tareas pendientes clave, todas relacionadas con la consolidación del modelo de dominio y la especificación técnica del sistema. En consecuencia, se creó y configuró la **Milestone “Pleaneación lista”**, con fecha límite para el **16 de marzo de 2026**, que agrupa exactamente esos issues:
- Mockups de panel de operador  
- Definir explícitamente los requisitos no funcionales del sistema  
- Realizar diagrama de casos de uso  
- Redactar explícitamente las historias de usuario
- Redactar user persona para el operador  
- Unificar lenguaje ubicuo y pulir bounded contexts/mockups  

Se discutió también el tema de **infraestructura en la nube**, confirmando el uso de **AWS** bajo su **capa gratuita**. Se acordó que, aunque el despliegue final no será en producción, contar con un entorno controlado en la nube facilitará integraciones reales (como Twilio o APIs externas) y pruebas end-to-end.

Respecto a otras discusiones, se re-afrimó el uso de **Twilio** para la comunicación telefónica, con énfasis en su capacidad para soportar llamadas programáticas y transcripción en tiempo real pero con un alcance acotado: por ahora funcionaremos únicamente con conexión a internet, si en el futuro se presenta la posibilidad, se considerará el uso de más herramientas para operar sin necesidad de conexión. Finalmente, se validó la elección de la **API de enrutamiento** de acuerdo a la investigación propuesta.

## Compromisos acordados

Para asegurar el cumplimiento de la milestone y la preparación técnica, se establecieron los siguientes compromisos:

- **Crear una única cuenta AWS compartida** y distribuir las credenciales entre el equipo para gestionar recursos de forma coordinada (aunque el uso efectivo será mucho más a futuro en el proyecto).
- **Finalizar todos los issues asociados a la milestone “Pleaneación lista” antes del 16 de marzo de 2026**, priorizando la coherencia del lenguaje ubicuo, la claridad de los casos de uso, historias de usuario y la completitud de los mockups.
- Cada miembro se compromete a actualizar su tarea asignada dentro de la milestone, asegurando buenos avances y retroalimentación temprana.

> *Nota:* El cumplimiento de esta milestone es crítico, ya que habilitará la transición a la fase de implementación técnica y futura validación del prototipo.