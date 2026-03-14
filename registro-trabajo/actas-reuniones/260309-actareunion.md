# Acta de Reunión – Refinamiento del Dominio y Alineación de Alcance

**Semestre:** 2026-1
**Fecha:** 09/03/2026

## Asistentes del encuentro presencial
- Juan Esteban Páez Gil  
- Isabela Arrubla Orozco  
- Fernando González Rivero  
- Samuel Betancur Muñoz 

## Objetivos de la reunión

La reunión tuvo como propósito principal **socializar los avances propuestos en la sesión anterior**, especialmente en torno a las historias de usuario y el modelo del dominio, y **organizar las actividades técnicas y de diseño para la presente semana**, asegurando que todo el equipo comparta una visión clara y alineada del alcance y los límites del proyecto, con miras a cumplir la **Milestone “Pleaneación lista”** antes del **16 de marzo de 2026**.

## Temas tratados

El equipo inició revisando las **historias de usuario** ya documentadas, ajustando redacción, términos y estructura para garantizar mayor claridad y coherencia con el lenguaje del dominio. Se eliminaron ambigüedades y se unificó la terminología.

Posteriormente, se discutieron posibles **roles adicionales**, como el de *administrador*. Sin embargo, tras analizar el **alcance definido en la propuesta**, se concluyó que dicho rol **queda fuera del dominio del problema**: la gestión de usuarios, credenciales, permisos o configuraciones administrativas no es parte del flujo central de atención de emergencias ni está contemplado en los objetivos del prototipo. Por tanto, se decidió **excluir explícitamente** cualquier funcionalidad relacionada con administración de cuentas, incluyendo el alta, baja o modificación de perfiles de operadores o paramédicos.

Esta discusión llevó a un **refinamiento más profundo del alcance**, donde se reafirmaron límites clave:
- El sistema **no gestionará autenticación ni autorización compleja**; se asumirá que los actores ya están registrados y validados externamente.
- La **interacción se centrará exclusivamente en el ciclo de vida de una emergencia**: desde la activación de la alerta hasta la entrega del paciente al hospital.

Se siguió con la **revisión de los compromisos anteriores y avances** en la sincronización pasada. Se confirmó el estado actual de los **issues** agrupados en la **Milestone “Pleaneación lista”**:
- Definición de requisitos no funcionales
- Diagrama de casos de uso
- Redacción de historias de usuario
- User Persona del Operador
- Mejoras de lenguaje ubicuo y bounded contexts: Se avanzó en la discusión y se dejaron tareas de pulido.

Además, se abordaron varias dudas relacionadas con escenarios específicos: ¿qué pasa si un usuario gestiona la emergencia de un tercero y no tiene su ubicación? ¿cuántos perfiles debería poder registrar una única persona? Estas preguntas permitieron identificar áreas donde se requiere mayor especificación y guiarán las próximas iteraciones.

## Compromisos acordados

Para avanzar en la consolidación del modelo y asegurar el cierre de la **Milestone “Pleaneación lista”** antes del **16 de marzo**, se establecieron los siguientes compromisos:

- **Todos los miembros** revisarán las historias de usuario actualizadas en el repositorio, validando su claridad, valor de negocio y alineación con el dominio.
- **Familiarizarse con el estado actual del frontend**, explorando componentes, rutas y patrones de interacción ya implementados para garantizar que un futuro trabajo sea coherente con la implementación actual -> *Responsables: Juan Esteban Paez Gil*
- **Pulir aspectos del lenguaje ubicuo**, asegurando consistencia en nombres de entidades, eventos y reglas de negocio en toda la documentación y el código -> *Responsables: Samuel Betancur Muñoz*
- **Finalizar el User Persona del Operador**, completando su perfil, mapa de empatía y jornada de usuario, para cerrar el trío de actores principales (Paciente, Paramédico, Operador) -> *Responsable: Isabela Arrubla Orozco*

### Plan de trabajo para la próxima semana

Para lograr el cierre exitoso de la milestone, el equipo acordó dividirse los issues pendientes y trabajarlos en paralelo durante la semana. Cada miembro asumirá la responsabilidad de una o varias tareas específicas. El objetivo es tener todos los entregables listos para la próxima reunión, de manera que podamos revisar el cierre de la milestone y, a partir de esa fecha, comenzar con la fase de implementación pura de la solución.

> **Nota:** El cumplimiento de esta milestone es crítico, ya que habilitará la transición a la fase de implementación técnica y futura validación del prototipo. La próxima reunión se llevará a cabo el **16 de marzo de 2026** para revisar el cierre de la milestone y planificar la siguiente fase.