# Análisis de Costos de Hosting en la Nube — SIEE

> **SIEE**: Sistema de Información para la Gestión de Emergencias  
> **Fecha**: Julio 2026  
> **Alcance**: Despliegue prototipo funcional (~200 usuarios concurrentes)  
> **Región de referencia**: us-east-1 (AWS), us-central1 (GCP), East US (Azure)

---

## 1. Servicios a desplegar

A partir del `docker-compose.yaml`, el sistema consta de los siguientes servicios:

| #   | Servicio                      | Tecnología                     | Rol                                              |
| --- | ----------------------------- | ------------------------------ | ------------------------------------------------ |
| 1   | dragonflyDb                   | DragonflyDB (Redis-compatible) | Cache en memoria / datos en tiempo real          |
| 2   | rabbit                        | RabbitMQ 4.2                   | Broker de mensajes                               |
| 3   | mongo                         | MongoDB                        | Base de datos persistente                        |
| 4   | coordinator                   | FastAPI (Python 3.12)          | Microservicio — coordinación de emergencias      |
| 5   | paramedic-location-updater    | FastAPI (Python 3.12)          | Microservicio — actualización de ubicación       |
| 6   | auth                          | FastAPI (Python 3.12)          | Microservicio — autenticación OAuth2/JWT         |
| 7   | paramedic-recommendation      | FastAPI (Python 3.12)          | Microservicio — recomendación de paramédicos     |
| 8   | medical-center-recommendation | FastAPI (Python 3.12)          | Microservicio — recomendación de centros médicos |
| 9   | historical-api                | FastAPI (Python 3.12)          | Microservicio — API de datos históricos          |
| 10  | routing                       | FastAPI (Python 3.12)          | Microservicio — enrutamiento                     |
| 11  | nginx-proxy                   | Nginx 1.29                     | Reverse proxy / API gateway                      |

**Total**: 8 contenedores de aplicación + 3 servicios de infraestructura = **11 contenedores**.

---

## 2. Mapeo a servicios gestionados en la nube

Cada servicio del docker-compose tiene un equivalente gestionado en las tres nubes principales. A continuación se detalla el mapeo y los costos estimados mensuales.

### 2.1. Cache en memoria (DragonflyDB → Redis gestionado)

| Proveedor | Servicio                         | Instancia                | Costo/mes |
| --------- | -------------------------------- | ------------------------ | --------- |
| AWS       | ElastiCache for Redis (o Valkey) | cache.t4g.micro (0.5 GB) | ~$6       |
| GCP       | Memorystore for Redis            | Basic M1 (1 GB)          | ~$35      |
| Azure     | Azure Cache for Redis            | Basic C0 (250 MB)        | ~$16      |

> **Nota**: DragonflyDB es compatible con el protocolo Redis, por lo que cualquier servicio gestionado de Redis funciona como reemplazo directo.

### 2.2. Broker de mensajes (RabbitMQ)

| Proveedor | Servicio                                     | Instancia                     | Costo/mes | Consideración                                                     |
| --------- | -------------------------------------------- | ----------------------------- | --------- | ----------------------------------------------------------------- |
| AWS       | Amazon MQ for RabbitMQ                       | mq.t3.micro (instancia única) | ~$18      | Compatibilidad directa con protocolo RabbitMQ                     |
| GCP       | RabbitMQ en GCE (no hay servicio gestionado) | e2-micro + Cloud Pub/Sub      | ~$25–35   | No hay RabbitMQ gestionado en GCP; se usa VM o se migra a Pub/Sub |
| Azure     | Azure Service Bus                            | Basic tier                    | ~$0.50    | Requiere refactorización del código (AMQP 1.0 ≠ AMQP 0-9-1)       |
| Azure     | RabbitMQ en AKS                              | B2s VM                        | ~$33      | Preserva compatibilidad de protocolo                              |

> **⚠️ Consideración crítica**: La aplicación usa el protocolo AMQP 0-9-1 nativo de RabbitMQ. Si se elige un broker diferente (Azure Service Bus, Google Pub/Sub), se requiere refactorización del código de integración. Esto agrega costo de desarrollo pero reduce el costo operativo.

### 2.3. Base de datos (MongoDB)

| Proveedor | Servicio                | Instancia                      | Costo/mes | Consideración                                           |
| --------- | ----------------------- | ------------------------------ | --------- | ------------------------------------------------------- |
| AWS       | DocumentDB              | db.t3.medium (instancia única) | ~$47      | Compatible con la API de MongoDB, no es MongoDB nativo  |
| AWS       | MongoDB Atlas on AWS    | M10 (2 vCPU, 2 GB RAM)         | ~$58      | MongoDB nativo, gestionado por MongoDB Inc.             |
| AWS       | MongoDB Atlas Flex      | Shared cluster                 | ~$15      | Más barato, pero recursos compartidos                   |
| GCP       | MongoDB Atlas on GCP    | M10                            | ~$57      | Similar a AWS                                           |
| GCP       | MongoDB Atlas Flex      | Shared cluster                 | ~$15      | Recursos compartidos                                    |
| Azure     | Cosmos DB (MongoDB API) | Serverless + free tier         | ~$0–10    | Free tier: 1000 RU/s + 25 GB; suficiente para prototipo |
| Azure     | MongoDB Atlas on Azure  | M10                            | ~$57      | MongoDB nativo                                          |

> **Nota**: Cosmos DB con API de MongoDB tiene la capa gratuita más generosa (1000 RU/s + 25 GB de por vida), lo cual es muy atractivo para un prototipo universitario.

### 2.4. Contenedores de aplicación (7 FastAPI + 1 Nginx)

| Proveedor | Servicio         | Configuración                                  | Costo/mes | Notas                                              |
| --------- | ---------------- | ---------------------------------------------- | --------- | -------------------------------------------------- |
| AWS       | ECS Fargate      | 8 tareas × 0.25 vCPU × 0.5 GB (x86)            | ~$72      | Always-on; ~$58 con ARM/Graviton                   |
| AWS       | ECS Fargate Spot | 8 tareas × 0.25 vCPU × 0.5 GB                  | ~$22      | Puede ser interrumpido (no ideal para emergencias) |
| GCP       | Cloud Run        | 8 servicios, 0.5 vCPU × 512 MiB, scale-to-zero | ~$10–20   | Pago por uso; ideal para tráfico variable          |
| Azure     | Container Apps   | 8 contenedores, scale-to-zero                  | ~$10–30   | Similar a Cloud Run con grants gratuitos generosos |

> **Importante**: Para un sistema de emergencias que requiere alta disponibilidad, las opciones "always-on" son preferibles. Sin embargo, para un prototipo académico, scale-to-zero es aceptable.

### 2.5. Reverse Proxy / Load Balancer (Nginx)

| Proveedor | Servicio                        | Costo/mes | Consideración                                     |
| --------- | ------------------------------- | --------- | ------------------------------------------------- |
| AWS       | Application Load Balancer (ALB) | ~$25      | Reemplaza nginx como entrypoint                   |
| GCP       | Cloud Load Balancing (L7)       | ~$18      | Incluye certificados SSL gestionados              |
| Azure     | Application Gateway V2          | ~$146     | ❌ Desproporcionadamente caro                     |
| Azure     | Container Apps ingress + nginx  | ~$0       | ✅ Ingress incluido en Container Apps             |
| Todas     | Nginx como contenedor           | ~$0       | Se ejecuta dentro del orquestador de contenedores |

> **Recomendación**: Ejecutar nginx como un contenedor más dentro del servicio de contenedores (Cloud Run/Container Apps/ECS), eliminando la necesidad de un load balancer externo costoso. Alternativamente, el load balancer gestionado puede reemplazar completamente a nginx.

### 2.6. Red y conectividad

| Componente                     | AWS        | GCP                  | Azure                                |
| ------------------------------ | ---------- | -------------------- | ------------------------------------ |
| NAT Gateway                    | ~$33/mes   | ~$32/mes (Cloud NAT) | $0 (no necesario con Container Apps) |
| VPC Endpoints (alternativa)    | ~$7–14/mes | N/A                  | N/A                                  |
| Transferencia de datos (10 GB) | ~$1        | ~$0.90               | $0 (primeros 100 GB gratis)          |

### 2.7. Monitoreo

| Proveedor | Servicio         | Costo/mes                    |
| --------- | ---------------- | ---------------------------- |
| AWS       | CloudWatch       | ~$5–10                       |
| GCP       | Cloud Monitoring | ~$0 (dentro del free tier)   |
| Azure     | Azure Monitor    | ~$0–5 (dentro del free tier) |

---

## 3. Resumen comparativo de costos mensuales

### 3.1. Configuración recomendada por proveedor

#### AWS — Configuración viable más económica

| Servicio      | Servicio AWS                               | Costo/mes      |
| ------------- | ------------------------------------------ | -------------- |
| Cache         | ElastiCache (cache.t4g.micro, Valkey)      | $6             |
| Broker        | Amazon MQ RabbitMQ (mq.t3.micro)           | $18            |
| Base de datos | DocumentDB (db.t3.medium, instancia única) | $47            |
| Contenedores  | ECS Fargate (8 tareas, x86)                | $72            |
| Load Balancer | ALB                                        | $25            |
| NAT Gateway   | NAT Gateway                                | $33            |
| Monitoreo     | CloudWatch                                 | $7             |
| Transferencia | 10 GB outbound                             | $1             |
| **TOTAL**     |                                            | **≈ $209/mes** |

> **Conoptimizaciones**: Usando ARM/Graviton en Fargate (-$14), VPC Endpoints en lugar de NAT Gateway (-$19~26), MongoDB Atlas Flex en lugar de DocumentDB (-$32): **≈ $144–154/mes**

#### GCP — Configuración viable más económica

| Servicio      | Servicio GCP                           | Costo/mes      |
| ------------- | -------------------------------------- | -------------- |
| Cache         | Memorystore for Redis (Basic M1)       | $35            |
| Broker        | RabbitMQ en VM e2-micro                | $25            |
| Base de datos | MongoDB Atlas Flex (M2)                | $15            |
| Contenedores  | Cloud Run (8 servicios, scale-to-zero) | $15            |
| Load Balancer | Cloud Load Balancing (L7)              | $18            |
| NAT           | Cloud NAT                              | $32            |
| Monitoreo     | Cloud Monitoring (free tier)           | $0             |
| Transferencia | 10 GB outbound                         | $1             |
| **TOTAL**     |                                        | **≈ $141/mes** |

> **Con optimizaciones**: Usar Cloud Router sin NAT ($0 si no hay IPs estáticas necesarias), MongoDB Atlas M0 ($0): **≈ $69–74/mes**

#### Azure — Configuración viable más económica ⭐

| Servicio                    | Servicio Azure                                 | Costo/mes     |
| --------------------------- | ---------------------------------------------- | ------------- |
| Cache                       | Azure Cache for Redis (Basic C0)               | $16           |
| Broker                      | Azure Service Bus Basic                        | $0.50         |
| Base de datos               | Cosmos DB Serverless (MongoDB API, free tier)  | $0–10         |
| Contenedores                | Container Apps (8 contenedores, scale-to-zero) | $10–30        |
| Reverse Proxy               | Container Apps ingress + nginx                 | $0            |
| NAT                         | No necesario                                   | $0            |
| Monitoreo                   | Azure Monitor (free tier)                      | $0–5          |
| Transferencia               | 10 GB (primeros 100 GB gratis)                 | $0            |
| **TOTAL (estimación baja)** |                                                | **≈ $27/mes** |
| **TOTAL (estimación alta)** |                                                | **≈ $62/mes** |

> **Con RabbitMQ nativo** (sin refactorización a Service Bus): agregar ~$33 para RabbitMQ en AKS → **≈ $60–95/mes**

### 3.2. Tabla comparativa resumida

| Proveedor                       | Configuración base | Con optimizaciones | Refactorización requerida            |
| ------------------------------- | ------------------ | ------------------ | ------------------------------------ |
| **AWS**                         | ~$209/mes          | ~$144–154/mes      | Ninguna                              |
| **GCP**                         | ~$141/mes          | ~$69–74/mes        | RabbitMQ → Pub/Sub (opcional)        |
| **Azure** ⭐                    | ~$27–62/mes        | —                  | RabbitMQ → Service Bus (recomendada) |
| **Azure** (sin refactorización) | ~$60–95/mes        | —                  | Ninguna                              |

---

## 4. Análisis de beneficios y desventajas por proveedor

### AWS

| Ventajas                                 | Desventajas                                                  |
| ---------------------------------------- | ------------------------------------------------------------ |
| Mayor ecosistema de servicios            | Más caro para este caso de uso                               |
| Amazon MQ soporta RabbitMQ nativo        | NAT Gateway agrega ~$33/mes                                  |
| Amplia documentación y comunidad         | Configuración más compleja (VPC, subnets, etc.)              |
| DocumentDB es compatible con MongoDB API | DocumentDB no es MongoDB nativo (incompatibilidades menores) |

### GCP

| Ventajas                                  | Desventajas                                        |
| ----------------------------------------- | -------------------------------------------------- |
| Cloud Run es excelente para scale-to-zero | Memorystore es caro ($35 vs $6–16 en AWS/Azure)    |
| MongoDB Atlas tiene tier gratuito en GCP  | No hay RabbitMQ gestionado (requiere VM)           |
| Cloud Monitoring generoso en free tier    | Ecosistema más limitado para este stack específico |

### Azure ⭐

| Ventajas                                                 | Desventajas                                       |
| -------------------------------------------------------- | ------------------------------------------------- |
| **Más económico** para este caso de uso                  | Service Bus requiere refactorización de RabbitMQ  |
| Cosmos DB free tier es muy generoso                      | Azure Cache for Redis Basic no tiene SLA          |
| Container Apps con scale-to-zero es ideal para prototipo | Application Gateway es excesivamente caro         |
| Transferencia de datos gratuita (primeros 100 GB)        | Menos maduro que AWS/GCP en containers serverless |
| Crédito de $100 para estudiantes                         |                                                   |

---

## 5. Consideración sobre refactorización de RabbitMQ

Dado que la refactorización de RabbitMQ a Azure Service Bus (o Google Pub/Sub) tiene un impacto significativo en el costo operativo, es importante evaluar este trade-off:

| Factor                  | Mantener RabbitMQ              | Migrar a Service Bus / Pub/Sub                                                                             |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Costo operativo**     | +$25–33/mes (VM para RabbitMQ) | $0.50/mes (Service Bus Basic) o $0 (Pub/Sub free tier)                                                     |
| **Costo de desarrollo** | $0                             | ~2–4 días de trabajo (estimado)                                                                            |
| **Riesgo técnico**      | Bajo (sin cambios)             | Medio (cambiar protocolo de mensajería)                                                                    |
| **Punto de equilibrio** | —                              | Ahorro mensual cubre el costo de desarrollo en ~3–6 meses                                                  |
| **Impacto en código**   | Ninguno                        | Refactorizar adaptadores de mensajería en `paramedic-location-updater` y otros servicios que usen RabbitMQ |

> Dado que el proyecto sigue una arquitectura hexagonal con adaptadores bien definidos, la refactorización del adaptador de mensajería es un cambio localizado y de bajo riesgo. **Se recomienda evaluar esta migración si el presupuesto operativo es una restricción importante.**

---

## 6. Presupuesto anual estimado

| Proveedor                         | Mensual (bajo) | Mensual (alto) | Anual (bajo) | Anual (alto) |
| --------------------------------- | -------------- | -------------- | ------------ | ------------ |
| AWS                               | $144           | $209           | $1,728       | $2,508       |
| GCP                               | $69            | $141           | $828         | $1,692       |
| **Azure** ⭐                      | **$27**        | **$62**        | **$324**     | **$744**     |
| Azure (sin refactorizar RabbitMQ) | $60            | $95            | $720         | $1,140       |

### Costo anual con crédito de estudiante

- **Azure for Students**: $100 crédito gratuito al inicio → cubre ~2–4 meses del servicio
- **AWS Educate**: $100–200 crédito → cubre ~1 mes del servicio
- **GCP for Education**: $200 crédito → cubre ~2–3 meses del servicio

---

## 7. Recomendación final

### Para el prototipo académico: **Azure** 🏆

Azure es la opción más económica para este proyecto específico por las siguientes razones:

1. **Cosmos DB free tier** cubre completamente las necesidades de base de datos de un prototipo.
2. **Container Apps** con scale-to-zero reduce drásticamente el costo de compute cuando el sistema no está en uso.
3. **Azure Service Bus Basic** es prácticamente gratuito y funcionalmente equivalente a RabbitMQ para este caso de uso.
4. **Transferencia de datos gratuita** (100 GB/mes) es más que suficiente.
5. **El crédito de $100 para estudiantes** cubre los primeros meses.

### Si se requiere mantener RabbitMQ sin refactorización: **GCP** 🥈

GCP ofrece el mejor balance entre costo y compatibilidad con el stack actual (MongoDB Atlas free tier, Cloud Run para containers). Sin embargo, el Memorystore para Redis es significativamente más caro que las alternativas.

### Si se requiere máxima madurez y ecosistema: **AWS** 🥉

AWS tiene el ecosistema más maduro y la mejor compatibilidad directa con todos los servicios del stack actual (Amazon MQ soporta RabbitMQ nativo, DocumentDB es compatible con MongoDB API), pero es el más caro para este caso de uso específico.

---

## 8. Supuestos y advertencias

1. Los precios son estimaciones basadas en tarifas publicadas al momento de elaboración (julio 2026) y pueden variar.
2. Se asume una única región de despliegue sin alta disponibilidad (aceptable para prototipo).
3. Los costos de Container Apps/Cloud Run/Fargate asumen tráfico bajo correspondiente a un prototipo universitario (~200 usuarios concurrentes máximos).
4. No se incluyen costos de dominio, certificados SSL (gratuitos con Let's Encrypt o gestionados por el proveedor), ni desarrollo.
5. El costo de refactorización de RabbitMQ a Service Bus/Pub/Sub se estima en 2–4 días de trabajo, pero no se incluye en el presupuesto operativo.
6. Se recomienda utilizar las alertas de presupuesto de cada proveedor para evitar sobrecostos inesperados.
7. Los precios de MongoDB Atlas pueden variar según la región y disponibilidad del tier gratuito.
