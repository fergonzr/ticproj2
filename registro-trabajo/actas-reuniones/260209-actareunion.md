# Acta de Reunión – Definición Inicial y Arquitectura del Sistema

**Semestre:** 2026-1  
**Fecha:** 9/02/2026

## Asistentes del encuentro presencial
- Juan Esteban Páez Gil  
- Isabela Arrubla Orozco  
- Fernando González Rivero  
- Samuel Betancur Muñoz 

## Objetivos de la reunión

La reunión tuvo como propósito principal **definir decisiones técnicas clave para el desarrollo del proyecto**, incluyendo la 
arquitectura general, tecnologías base y patrones de comunicación. Adicionalmente, se buscó **socializar los hallazgos y avances obtenidos desde la sesión anterior**, con el fin de alinear al equipo en torno a un modelo técnico común y establecer compromisos 
concretos para la siguiente fase de diseño.

## Temas tratados

El equipo inició la sesión revisando un **diagrama UML preliminar** que propone las clases principales del sistema (Paciente, Paramédico,Operador, Alerta, Hospital, etc.) y su interacción mediante eventos, lo que permitió visualizar los componentes centrales y sus
responsabilidades.

A partir de allí, se tomó la decisión de adoptar una **arquitectura basada en microservicios**, considerando la necesidad de 
escalabilidad, independencia de despliegue y diferenciación clara de responsabilidades entre las interfaces de paciente, operador y 
paramédico. Esta elección también facilita la futura integración con sistemas externos (como hospitales o el CRUE) sin acoplar el núcleo 
del sistema.

Se abordó en profundidad el **manejo de caché** como mecanismo para optimizar tiempos de respuesta en operaciones críticas (como lo son las alertas médicas). Se compararon opciones como **Redis**, **Memcached**, **Dragonfly** y **Valkyrie**, analizando sus ventajas en rendimiento, persistencia y casos de uso. Llegando a la conclusión de escoger *Dragonfly*

Además, se esbozaron **diagramas de comunicación** que ilustran los flujos entre las entidades principales (paciente, operador y paramédico, BD persistente y caché), destacando los momentos clave: activación de alerta, triaje telefónico, asignación de recurso, actualización en ruta y entrega al hospital. Con base en estos flujos, se definieron de forma preliminar **estructuras de mensajes y contratos API** para los endpoints más críticos, priorizando claridad, idempotencia y buen manejo de la información.

## Compromisos acordados

Con el fin de avanzar hacia una especificación técnica sólida, el equipo acordó los siguientes compromisos:

- **Redactar un documento de lenguaje ubicuo** que defina los términos clave del dominio (“alerta”, “triaje”, “recurso”, “disponibilidad”) con precisión y consistencia, evitando ambigüedades entre áreas técnicas y funcionales -> *Responsables: Samuel Betancur Muñoz*
- **Finalizar la definición de las APIs** principales, incluyendo métodos, rutas, esquemas de solicitud/respuesta -> *Responsables: Fernando González Rivero*
- **Investigar servicios o librerías que permitan realizar llamadas telefónicas** para evaluar su viabilidad en el flujo de triaje inicial  -> *Responsables: Juan Esteban Paez Gil*
- **Consultar con un experto en bases de datos** para obtener una opinión técnica fundamentada sobre si el sistema debe utilizar una base de datos **SQL desnormalizada** o una solución **NoSQL**, considerando factores como volumen de escritura, integridad, complejidad de relaciones y necesidad de transacciones -> *Responsables: Juan Esteban Paez Gil*
- **Investigar el patrón publicador-suscriptor** en el contexto de **Dragonfly** (o alternativas viables), incluyendo su implementación, rendimiento y bindings disponibles para Python, con miras a su posible uso en notificaciones o sincronización de estado  -> *Responsable: Isabela Arrubla Orozco*
