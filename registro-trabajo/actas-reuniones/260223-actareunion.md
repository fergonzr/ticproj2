# Acta de Reunión – Alineación Técnica y Preparación para Presentación

**Semestre:** 2026-1  
**Fecha:** 23/02/2026

## Objetivos de la reunión

La reunión tuvo como propósito principal **retroalimentar las actividades realizadas en la semana previa** y, sobre todo, **alinear al equipo en torno a decisiones técnicas clave**, con el fin de garantizar que todos los miembros compartan una visión unificada del modelo de dominio, la arquitectura y la estrategia de implementación del sistema.

## Temas tratados

El equipo inició revisando los **bounded contexts** propuestos, reafirmando sus límites y responsabilidades. Se acordó que cada contexto debe mantener cohesión interna y mínima dependencia externa, respetando los principios del diseño orientado al dominio (DDD).

Posteriormente, se profundizó en la **arquitectura del backend**, confirmando la adopción de un enfoque **hexagonal (Ports & Adapters)** combinado con el patrón **CQRS (Command Query Responsibility Segregation)** y otros. Esta combinación permite separar claramente la lógica de negocio del dominio de los detalles técnicos (bases de datos, APIs, servicios externos) y optimizar operaciones de lectura y escritura de forma independiente.

Se definieron con mayor precisión los conceptos centrales del modelo:  
- **Entidades**: objetos con identidad única  
- **Agregados**: agrupaciones consistentes 

Además, se establecieron **reglas de negocio críticas**:  
- El estado de una alerta debe respetar estrictamente la **máquina de estados** definida (reportada → asignada → despachado → cerrado | cancelado).  
- Existen relaciones **1:1 obligatorias**: una emergencia solo puede tener una unidad de atención asignada; un paramédico está vinculado a una sola unidad de atención a la vez.  
- La finalización del **triaje** es el evento que **dispara el proceso de enrutamiento inteligente** hacia el hospital más adecuado.

En cuanto a integraciones externas, se re-socializó el uso de **Twilio** para la comunicación telefónica en el triaje inicial. Se discutieron sus funcionalidades (llamadas programáticas, IVR, transcripción) y se identificaron **costos potenciales** asociados al volumen de uso, aunque se acordó que, en esta fase, se priorizará una integración simulada o de bajo consumo.

Finalmente, se realizó una **socialización de avances en el frontend**, donde se presentaron los componentes iniciales y se definió la **división de responsabilidades** entre los miembros del equipo para las próximas iteraciones.

## Compromisos acordados

Para avanzar hacia la entrega de la presentación y consolidar el modelo técnico, se establecieron los siguientes compromisos:

- **Refinar los bounded contexts y la terminología del dominio**, asegurando consistencia en nombres, responsabilidades y contratos entre contextos -> *Responsables: Fernando González Rivero y Samuel Betancur Muño*
- **Preparar una sesión con Víctor (experto del dominio)** para formular preguntas específicas sobre el **proceso de triaje**, identificar matices clínicos no considerados y validar reglas de negocio críticas -> *Responsables: Samuel Betancur Muñoz*
- **Configurar el entorno de desarrollo del frontend para trabajar en localhost**, permitiendo una visión clara del producto final en etapas tempranas -> *Responsables: Samuel Betancur Muñoz, Fernando González Rivero e Isabela Arrubla Orozco*
- **Pulir y completar el documento de propuesta del proyecto**, incorporando los avances en arquitectura, modelo de dominio y análisis técnico -> *Responsable: Isabela Arrubla Orozco*
- **Preparar la presentación final y sus diapositivas**, asegurando coherencia entre narrativa, diagramas y demostración técnica -> *Responsable: Isabela Arrubla Orozco*