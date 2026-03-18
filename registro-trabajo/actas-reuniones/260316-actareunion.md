# Acta de Reunión – Transición a Fase de Desarrollo Incremental

**Semestre:** 2026-1  
**Fecha:** 16/03/2026

## Objetivos de la reunión

La reunión tuvo como propósito principal **socializar los avances logrados desde la última sesión**, **planificar las actividades para las próximas dos semanas** y **discutir detalles técnicos clave** que permitan iniciar una fase de desarrollo, orientada a entregar un incremento funcional con valor real para los usuarios del sistema.

## Temas tratados

El equipo inició con la **socialización de actividades pendientes**, destacando la incorporación activa del compañero que se encontraba  desactualizado del frontend. Este compartió los avances realizados: exploración del entorno local, configuración del proyecto en su máquina y pequeñas mejoras en componentes base, lo que le permite ahora contribuir de forma alineada con el resto del equipo.

Posteriormente, se revisaron en conjunto las **historias de usuario ya documentadas**, validando su claridad, cobertura por rol (paciente/ciudadano, operador, paramédico) y coherencia con el modelo del dominio. Durante esta revisión surgieron breves discusiones técnicas sobre la implementación de ciertas funcionalidades (como la actualización en tiempo real del estado de una alerta o la visualización de recursos).

Se hizo una **revisión exhaustiva de los issues asociados a la milestone “Pleaneación lista” (fecha límite: 16 de marzo de 2026)**. Tras evaluar cada uno, el equipo llegó a la concordancia de que **la mayoría han sido completados satisfactoriamente**: mockups iniciales, casos de uso, historias de usuario, lenguaje ubicuo y requisitos no funcionales están suficientemente definidos para dar paso a la construcción técnica. Por tanto, se declaró cerrada esta fase de planeación y se dio inicio formal a la fase de desarrollo.

## Compromisos acordados

Con miras a entregar un incremento funcional en dos semanas, se establecieron los siguientes compromisos:

- **Implementar al menos una historia de usuario por rol** durante este ciclo:
  - Una para el **ciudadano/paciente** (Activación de Alerta de Emergencia con Un Toque),
  - Una para el **operador** (Recepción de Alerta con Datos Estructurados),
  - Una para el **paramédico** (Recepción de Emergencia).
- **Desarrollar los mockups completos de la interfaz web del operador**, incluyendo estados de alerta, mapa de recursos y panel de asignación.
- **Continuar el desarrollo del frontend** en paralelo con la **especificación detallada de casos de uso** y el **avance del backend** (puertos, adaptadores, servicios).
- **Iniciar partes de la autenticación**, evaluando la implementación de un servicio basado en **JWT y tokens** para gestionar sesiones de operadores y paramédicos, sin salir del alcance definido (sin gestión de usuarios, solo validación de credenciales predefinidas).
- Convertir las historias de usuario en milestones ejecutables

> *Nota:* El objetivo final de este sprint es entregar un **incremento integrado y demostrable** que muestre el flujo básico de una emergencia, desde la activación hasta la asignación, validando la arquitectura y la comunicación entre capas.