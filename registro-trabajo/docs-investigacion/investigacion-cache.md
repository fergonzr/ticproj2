Investigación: Estrategia de Caché con Dragonfly 
===============================================================================================

Intro 
-----------------

Este documento presenta un análisis de la implementación de una estrategia de caché Write-Behind (Write-Back) utilizando Dragonfly como capa intermedia entre el backend y la base de datos persistente. La investigación demuestra que esta arquitectura ofrece ventajas significativas en términos de performance y escalabilidad, especialmente para sistemas con ráfagas de escritura intensas, aunque requiere consideraciones cuidadosas sobre garantías de entrega y persistencia de datos.

### Selección de Dragonfly

Dragonfly emerge como una solución óptima para esta arquitectura debido a:

*   **Alta Performance**: Diseñado para operaciones de escritura rápidas
    
*   **Compatibilidad Redis**: API compatible con Redis, facilitando la migración
    
*   **Escalabilidad**: Capacidad para manejar grandes volúmenes de datos
    
*   **Persistencia Configurable**: Opciones flexibles de persistencia según necesidades
    

### Consideraciones de Mensajería

#### Limitaciones del Modelo Pub/Sub Tradicional

El modelo Pub/Sub de Redis/Dragonfly presenta características inherentes que deben considerarse:

**Documentación Oficial de Redis**:

> "Redis' Pub/Sub exhibits at-most-once message delivery semantics. As the name suggests, it means that a message will be delivered once if at all. Once the message is sent by the Redis server, there's no chance of it being sent again. If the subscriber is unable to handle the message (for example, due to an error or a network disconnect) the message is forever lost"

*Basicamente* el modelo Pub/Sub de Redis/Dragonfly es de tipo "dispara y olvida" (fire-and-forget). Si el Worker está caído en el momento que el Backend envía el mensaje, el mensaje se pierde 

#### Alternativas para Garantía de Entrega

Para sistemas que requieren garantías más robustas, encontré las siguientes alternativas:

**Opción 1: Redis Streams**

*   **Persistencia**: Los datos sobreviven aunque no haya suscriptores activos
    
*   **Acuse de Recibo (ACK)**: Confirmación explícita de procesamiento
    
*   **Reprocesamiento**: Posibilidad de reintentar mensajes fallidos
    
*   **Ordenamiento**: Mantenimiento de orden secuencial de mensajes
    

**Opción 2: Listas como Cola (LPUSH/BRPOP)**

*   **Simplicidad**: Implementación más directa
    
*   **Bloqueo**: BRPOP permite espera eficiente de mensajes
    
*   **Persistencia**: Datos almacenados en memoria hasta procesamiento
    

| Característica         | Pub/Sub                          | Listas (LPUSH/BRPOP)           | Streams (XADD)                |
|------------------------|----------------------------------|--------------------------------|-------------------------------|
| Persistencia           | No (Fire & forget)               | Sí (Mientras no se lea)        | Sí (Incluso tras leer)        |
| Garantía de entrega    | Ninguna                          | Media (Se borra al leer)       | Alta (Requiere ACK)           |
| Escalabilidad          | Alta                             | Difícil (1 mensaje = 1 worker) | Excelente (Consumer Groups)   |
| Caso de uso            | Notificaciones chat              | Colas de tareas simples        | Write-Behind / Pipelines de datos |


Asique la eleccion queda en definir nuestra garantia de modelo de mensajeria, **At-Least-Once o At-Most-Once**

---

Se definió que manejaremos los datos asi: backend -> cache -> worker -> Base de datos persistente

#### Comparativa rápida:
- Write-Through: Se escribe en la caché y en la BD al mismo tiempo (síncrono). Es más seguro pero más lento.
- Cache-Aside: El backend lee de la caché; si no está, busca en la BD y actualiza la caché. Es la más común para lecturas.
- Write-Behind (La escogida): El backend le entrega a la caché y se olvida; un proceso secundario guarda en la BD después.

---

#### Idea

```
┌─────────────┐      XADD       ┌──────────────┐      XREADGROUP      ┌──────────────┐
│  FastAPI    │ ──────────────> │   Dragonfly  │ ───────────────────> │  Worker #1   │
│  Backend    │   (Stream)      │   (Streams)  │   (Consumer Group)   │   (sync)     │
└─────────────┘                 └──────────────┘                      └──────────────┘
                                                                       ┌──────────────┐
                                                                       │  Worker #2   │
                                                                       │   (sync)     │
                                                                       └──────────────┘
                                                                              ↓
                                                                       ┌──────────────┐
                                                                       │  PostgreSQL  │
                                                                       └──────────────┘
```

# Fuentes
- https://redis.readthedocs.io/en/stable/commands.html#
- https://redis.io/docs/latest/develop/pubsub/
- https://redis.io/docs/latest/develop/data-types/streams/
