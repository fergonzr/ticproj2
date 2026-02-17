# Acta de Reunión – Definición Arquitectónica y Preparación de la Propuesta 

**Semestre:** 2026-1  
**Fecha:** 16/02/2026

## Asistentes del encuentro presencial
- Juan Esteban Páez Gil  
- Isabela Arrubla Orozco  
- Fernando González Rivero  
- Samuel Betancur Muñoz 

## Objetivos de la reunión

La reunión tuvo como propósito principal **socializar las actividades asignadas en sesiones anteriores**, **discutir prioridades técnicas y funcionales** para las próximas semanas y **definir los lineamientos finales del documento de propuesta de proyecto** que será entregado como avance formal del curso. Adicionalmente, se buscó alinear al equipo en torno a decisiones arquitectónicas clave que garanticen escalabilidad, mantenibilidad y cohesión con el dominio del problema.

## Temas tratados

El equipo inició revisando opciones tecnológicas para la funcionalidad de **comunicación telefónica**. Se analizó en detalle **Twilio** como proveedor líder, destacando su soporte para llamadas programáticas, IVR (Interactive Voice Response), transcripción en tiempo real y compatibilidad con múltiples regiones, incluyendo Colombia. Se acordó evaluar su viabilidad técnica y costo dentro del alcance del prototipo.

Posteriormente, se discutió la estrategia respecto a **proveedores de nube** (AWS, GCP, Azure). Se reafirmó el compromiso de mantener una arquitectura **agnóstica a la nube**, evitando dependencias profundas en servicios propietarios, lo que facilitará futuras migraciones o despliegues en entornos híbridos.

Uno de los puntos centrales fue la **definición de la arquitectura del sistema**. Tras analizar los riesgos de una arquitectura basada únicamente en microservicios (especialmente la posible contaminación de la lógica de negocio con detalles técnicos de infraestructura), el equipo decidió adoptar un enfoque **Hexagonal (Ports and Adapters)**. Esta arquitectura permite aislar el núcleo del dominio (casos de uso, reglas de negocio) de los adaptadores externos (APIs, bases de datos, servicios en la nube), garantizando mayor testabilidad y flexibilidad.

En este contexto, se abordó el patrón **CQRS (Command Query Responsibility Segregation)** para separar operaciones de escritura y lectura, especialmente útil en escenarios de alta concurrencia como la asignación de recursos en emergencias. Se evaluó **Redis** como solución de caché, utilizando la estrategia write-behind y se discutieron mecanismos para garantizar **consistencia eventual** y **garantías de entrega de mensajes** (por ejemplo, mediante colas persistentes).

Finalmente, se definió el **flujo de trabajo general**, el equipo acordó ciertas políticas como el uso de ramas para aislar funcionalidades y realizar merge al main únicamente con aprobación de cierto porcentaje del equipo

## Compromisos acordados

Para avanzar hacia la entrega de la propuesta final y la fase de implementación, se establecieron los siguientes compromisos:

- **Elaborar el diagrama UML de la arquitectura hexagonal**, destacando puertos, adaptadores y flujos de datos -> *Responsables: Fernando González Rivero*
- **Desarrollar el contenedor Docker para el componente coordinador**, asegurando configuración reproducible y aislamiento -> *Responsables: Fernando González Rivero*
- **Unificar todo el lenguaje ubicuo en un único archivo y pulir los bounded contexts/mockups** ubicado en el repositorio -> *Responsables: Samuel Betancur Muñoz*
- **Finalizar y entregar el documento completo de la propuesta de proyecto**, integrando todos los avances técnicos, de diseño y de investigación -> *Responsable: Isabela Arrubla Orozco*
- **Gestionar recursos necesarios**, como la creación de cuentas en AWS (u otro proveedor) para pruebas controladas evaluando e  **Iniciar la exploración del frontend** con herramientas como *React Native*, *Flexbox* y *Tailwind CSS* -> *Responsables: Juan Esteban Paez Gil*
