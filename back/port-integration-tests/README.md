# Librería de pruebas de integración para puertos

Este paquete **NO HACE NADA** por sí solo.
En vez de eso, actúa como una librería de pruebas de integración genéricas para varios tipos de **puertos** definidos en `core`. 
Como tal, define pruebas para adaptadores de estos tipos de puertos, de manera agnóstica a su implementación.
Sin embargo, como las definiciones para tales adaptadores se encuentran en otros paquetes, es imposible para este paquete ejecutar las pruebas que define por sí mismo.
En su lugar, las pruebas deberían ser ejecutados precisamente por estos otros paquetes, quienes pueden proveer una fixture para las pruebas con el adaptador que define.

El propósito es verificar la compatibilidad del adaptador definido de manera externa con su respectivo puerto definido en `core`.
Al ser agnóstico a la implementación, distintos adaptadores para un mismo puerto pueden ser sometidos a este mismo set de pruebas, promoviendo la reutilización de código.

## ¿Por qué esto no está en `core` directamente?

No todos los paquetes que dependen de `core` implementarán adaptadores a los cuales hacer pruebas de integración es relevante.
Para aquellos que sí, simplemente tendrían que añadir esta librería como dependencia.
