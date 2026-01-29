# Acta de Reunión – Seguimiento Inicial del Proyecto

**Semestre:** 2026-1  
**Fecha:** 26/01/2025  

## Asistentes del encuentro presencial
- Juan Esteban Paez Gil  
- Isabela Arrubla Orozco  
- Fernando González Rivero  
- Samuel Betancur Muñoz  

## Objetivos de la reunión

La reunión tuvo como propósito principal socializar el estado actual de las actividades asignadas en la sesión anterior y definir un cronograma preliminar de trabajo que permita alinear esfuerzos y establecer hitos clave para las próximas semanas.  
Adicionalmente, se buscó avanzar en la definición técnica del proyecto mediante la evaluación de tecnologías, estándares y buenas prácticas que guiarán su desarrollo.

## Temas tratados

Durante la sesión, el equipo realizó una socialización detallada de los resultados obtenidos en las investigaciones individuales. Se presentaron y compararon los frameworks **Django** y **FastAPI** como candidatos para el backend, destacando la conveniencia de **FastAPI** por su rendimiento, soporte nativo para **WebSockets** y facilidad para construir APIs asíncronas, una característica crítica para el sistema de atención que proponemos.

Se abordó también el procesamiento de datos, revisando herramientas como **Databricks**, pipelines **ETL** y otras plataformas relevantes para el manejo de registros históricos sensibles, en línea con el **Reto 4** del curso. Paralelamente, se evaluaron opciones para la generación automática de documentación técnica, incluyendo **MkDocs** (para Python) y **TypeDoc** (para TypeScript), con el fin de garantizar trazabilidad y mantenibilidad del código.

El equipo realizó una lluvia de ideas sobre la arquitectura general del sistema, proponiendo un primer diseño conceptual. Asimismo, se estableció una convención de estilo de código: atributos en `camelCase`, clases en `PascalCase` y funciones en `snake_case`, buscando consistencia multi-lenguaje.

En cuanto al contexto del mercado, se analizó el estado del arte, identificando soluciones existentes como **Pulsara** y **Flare**; se discutieron sus ventajas (interoperabilidad, integración con EMS) y limitaciones (costo, falta de adaptación local). Este análisis reforzó la pertinencia de nuestra propuesta para el contexto de la región.

Finalmente, se coordinaron los detalles logísticos para la presentación y sustentación del proyecto en la próxima clase y se elaboró de forma colaborativa la **matriz de riesgo**, identificando amenazas técnicas, operativas y de disponibilidad de información de acuerdo con su probabilidad e impacto.

## Compromisos acordados

Se establecieron los siguientes compromisos para la próxima reunión:

- Profundizar en el estudio de **WebSockets**, incluyendo patrones de comunicación en tiempo real y manejo de conexiones persistentes.  
- Investigar y comenzar a aprender **TypeScript**, considerando su uso en el frontend y en servicios intermedios.  
- Evaluar gestores de paquetes en Python (como **Poetry** o **Pipenv**) y frameworks de testing (**pytest**, **unittest**) para estandarizar el entorno de desarrollo.  
- Revisar y enriquecer la **matriz de riesgos** con escenarios de mitigación específicos.  

### Para compromisos a largo plazo se definió:
- Avanzar en la definición del modelo de datos, explorando si la base de datos será **relacional**, **no relacional** o **híbrida**, en función de los requisitos de interoperabilidad y rendimiento.  
- Investigar **algoritmos de enrutamiento** aplicables a emergencias médicas, considerando factores como tráfico en tiempo real, disponibilidad hospitalaria y gravedad del caso, comparándolos con la línea base del proyecto.  

Adicionalmente, se reportó que, en cumplimiento de uno de los compromisos, durante la tarde del mismo día se estableció contacto con la **Jefa de Seguridad del Municipio de Envigado** por medio de una llamada, con quien se sostuvo una conversación inicial sobre el contexto del proyecto.