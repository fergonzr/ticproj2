# Requisitos no funcionales para el proyecto

Estar inmerso en un contexto tan sensible como es el sector salud, y desempeñar una función tan crítica dentro de este (gestión de emergencias), impone requisitos no funcionales considerablemente estrictos para con el sistema.
Estos requisitos tendrán gran impacto en la arquitectura y comportamiento del producto a desarrollar, por lo que es buena idea definirlos explícitamente al momento de proponer el sistema en sí.
Esto con el fin de colocar metas que guíen el desarrollo, cuyo cumplimiento se pueda comprobar fácil y objetivamente al finalizar el proyecto.
Entendemos que estas metas podrían no ser suficientes para absolutamente todos los actores que se desenvuelven en el contexto de gestión de emergencias.
En esto recordamos al lector el objetivo del proyecto: desarrollar un **prototipo funcional**, pero sin dejar de ser de carácter *demostrativo* y *académico*, de un sistema de gestión de emergencias.
Si bien la discusión respecto a requisitos de **futuras iteraciones** de este producto está abierta, para los propósitos de delimitar el alcance este proyecto, los requisitos no funcionales para con el prototipo inicial están cerrados a los enunciados a continuación.
En aras de mantener este documento entendible para la mayor parte de interesados, sin perder precisión, las especificaciones técnicas para cada uno de estos requisitos (si aplican) se han mantenido aparte de la definición general del requisito.

## Tolerancia a fallos

> Las funcionalidades críticas del sistema siguen operando aún cuando aquellas no críticas no están disponibles.

El sistema desempeña distintas funciones alrededor de la atención de emergencias médicas.
No obstante, se hace una clara diferenciación entre aquellas funciones de importancia crítica, y aquellas de menor importancia.
Toda funcionalidad usada para directamente para atender situaciones donde haya vidas en riesgo entra en la primera categoría, mientras que el resto de estas caen en la segunda.

Es poco realista prometer la operación totalmente ininterrumpida del sistema.
Aún menos es garantizar una operación totalmente libre de errores.
Aún con todas las medidas preventivas, los sistemas siempre pueden fallar, bien sea por defectos en su diseño o por errores en su operación.
Con ello, se vuelve importante no sólo tomar tales medidas, sino también minimizar el impacto estas fallas.
Esto es, hacer que el sistema, como un todo, tolere que algunas de sus partes individuales fallen, pudiendo continuar operando con sus partes restantes.
Es así como definimos la **tolerancia a fallos**.

### Detalles técnicos

> Los microservicios de carácter crítico en el sistema siguen funcionando incluso cuando hay fallas en aquellos de carácter no crítico.

Al utilizar la arquitectura de microservicios, las responsabilidades del sistema se segregan lógicamente en distintos procesos, corriendo posiblemente en distintas máquinas.
Algunos servicios desempeñan funciones críticas, como la coordinación de la atención de emergencias, mientras que otros desempeñan funciones menos importantes.
Los servicios considerados críticos no pueden depender de la disponibilidad permanente de servicios considerados no críticos.
Mantener una distinción clara entre los dos es un corolario importante de este requisito.

## Alto rendimiento

> Los tiempos de respuesta para operaciones de gestión de emergencias se mantienen bajos incluso en intervalos de alta demanda.

Una gestión rápida de una emergencia necesita una coordinación ágil.
Al ser el medio de intercambio de información entre todas las partes involucradas, los tiempos de respuesta del sistema deben mantenerse lo suficientemente bajos como para parecer imperceptibles en la práctica, siendo insignificantes en relación con los tiempos de movilidad necesarios para atender una emergencia.
Esto se debe cumplir incluso si la totalidad de unidades de atención de emergencias en el área urbana del valle de aburrá están cada una atendiendo una emergencia.

### Detalles técnicos

Medir el rendimiento de un sistema es una tarea compleja, que involucra múltiples variables y puede utilizar múltiples variables.
Para efectos de establecer las métricas objetivo que para este requisito, utilizaremos las siguientes métricas:

- **Latencia (RT):** Tiempo transcurrido entre que se recibe una solicitud y se resuelve. En particular, el requisito impone minimizar el promedio de la latencia de cada solicitud en el sistema. Para propósitos de este prototipo, no se considera la latencia de red, siendo esto una preocupación del despliegue que por tanto supera el alcance del proyecto.
- **Número de usuarios concurrentes (CU):** Número de usuarios que realizan una transacción en el sistema dentro de una misma ventana de tiempo.
- **Transacciones por segundo (TPS):** Número de transacciones de negocio que puede completar el sistema en cada segundo de operación. Nótese que un sistema puede soportar distintos tipos de transacciones, con complejidades distintas. Por ello, esta métrica sólo se presta para comparación entre transacciones del mismo tipo. En general, `TPS = CU / RT`.

Es necesario discriminar dos distintos tipos de transacciones para proporcionar un objetivo para estas métricas. Se piensa implementar más tipos de transacciones pero no serán utilizadas para la gestión de emergencias así que no se tendrán en cuenta:

### 1. Actualización de la posición de un paramédico

Cuando la posición de un paramédico en turno cambia, este debe notificar su nueva posición para poder asistir en la asignación de emergencias.

- **Latencia aceptable (media):** 200 ms.
- **Número de usuarios concurrentes:** 200.
- **Transacciones por segundo:** 100 TPS.

### 2. Manipulación de emergencias activas

Estas son operaciones relacionadas con el cambio de estado de una emergencia, su consulta o una manipulación en su contenido en general, siempre y cuando esté activa.

- **Latencia aceptable (media):** 100 ms
- **Número de usuarios concurrentes:** 600.
- **Transacciones por segundo:** 6000 TPS.

## Seguridad

> Un actor no autenticado (como paramédico u operador) está únicamente autorizado a:
>
> 1. Reportar emergencias.
> 2. Ser notificado ante actualizaciones en la emergencia que reportó.

Es importante que únicamente el personal autorizado pueda acceder a la funcionalidad crítica del sistema.
Estas comprenden todas las características del sistema distintas al reporte de emergencias y las notificaciones generadas por actualizaciones en el estado de aquellas emergencias que reportó.
Dentro de estas características, algunas están habilitadas tanto para usuarios paramédicos como para operadores, otras únicamente para el primero, y otras únicamente para el segundo.
Es importante categorizar claramente las operaciones según qué tipo de usuario está autorizado a realizarlas, y hacer estas políticas de manera cabal.

### Detalles técnicos

La autenticación está sujeta a los siguientes criterios técnicos de aceptación:

- Implementa el protocolo Oauth2 y utilizar tokens JWT para llevar registro de las sesiones de los usuarios que accedan.
- Utiliza técnicas de hashing y salt para guardar y verificar contraseñas de los usuarios.

Adicionalmente, toda la comunicación con el sistema está cifrada a través de los protocolos estándares TLS/SSL, para evitar el robo de datos en tránsito.

## Desacoplamiento de sistemas externos

> Adaptar el producto para interoperar con un nuevo sistema externo, o a una nueva versión de alguno del que ya se depende, requiere únicamente modificaciones superficiales en su implementación.

Los actores que participan en el sector salud entran y salen constantemente, mucho más en el contexto de un país en desarrollo.
Con ellos, también se cambian los sistemas de información que posiblemente puedan alimentar de datos al producto.
En vista de esto, el prototipo debe de ser altamente adaptable a estos cambios desde el comienzo, separando claramente el núcleo del sistema de aquellas partes que funcionan como puente entre otros.
Son únicamente estas las que deberían tener que cambiar si se quiere integrar con otro sistema, no el núcleo en sí.

### Detalles técnicos

> Ante un cambio en la API de algún sistema externo con el cual el prototipo se comunique, es necesario únicamente actualizar el **adaptador** correspondiente dentro del prototipo.

La arquitectura hexagonal de la solución permite diferenciar claramente la lógica de negocio clave de las implementaciones técnicas clave necesarias para conectar esta lógica con el mundo real.
A estas últimas se les llama adaptadores, y se les llama así porque son quienes adaptan interfaces externas, proveídas por sistemas de los cuales no se tiene control.
Si se quiere reemplazar alguno de estos sistemas por otro, es el adaptador, no el núcleo, el que debe de actualizarse.

## Protección de privacidad de ciudadanos

> Es imposible recuperar del sistema los datos de información personal de un ciudadano asociado a una emergencia ó ya gestionada, ó reportada hace más de 24 horas.

Reconocemos que la privacidad de los ciudadanos es un derecho fundamental, especialmente reconociendo que su información médica es de carácter sensible.
La información suministrada por estos sólo se va a utilizar para el efecto de coordinar los recursos necesarios para atender la emergencia en la cual en el momento se ve involucrado.
Como tal, toda esta información se elimina del sistema una vez esta emergencia se ha gestionado, o, en caso que se cancele por cualquier motivo, después de 24 horas de haberse reportado.
Los registros históricos que la aplicación guarda sólo muestran información de localización y temporalidad de las emergencias sucedidas, jamás de los ciudadanos asociados a la misma.

Es por ello que no se implementará un registro o inicio de sesión para ciudadanos regulares, única y opcionalmente un formulario médico con el único propósito de acelerar el triaje una se reporte una emergencia, y que no sale del dispositivo local salvo esta ocasión.
