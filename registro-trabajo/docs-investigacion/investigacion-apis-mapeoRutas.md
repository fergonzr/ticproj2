# Investigación de APIs de Enrutamiento para Servicio de Emergencias Médicas

## Introducción y Contexto del Proyecto

El presente documento tiene como objetivo evaluar las alternativas disponibles en el mercado para APIs de enrutamiento que permitan calcular trayectos entre dos puntos en una ciudad. El caso de uso específico corresponde a un sistema de gestión de emergencias médicas donde se requiere generar rutas en dos etapas: primero, desde la posición del paramédico hasta la ubicación de la emergencia, y segundo, desde la emergencia hasta el centro de atención médica seleccionado.

Este proyecto tiene carácter demostrativo y académico, por lo que los criterios de evaluación priorizan la disponibilidad de planes gratuitos, la calidad de la documentación, la facilidad de integración y la estabilidad del servicio. No se contempla auto-alojamiento de soluciones, ya que el objetivo es minimizar la complejidad de infraestructura y concentrar los esfuerzos en el desarrollo de la lógica de negocio del sistema de emergencias.

Los servicios evaluados fueron analizados considerando sus aspectos técnicos, modelos de autenticación, condiciones de uso gratuito, y características específicas que impactan la experiencia de desarrollo e integración.

---

## 1. GraphHopper

### Descripción General y Arquitectura

GraphHopper es un motor de enrutamiento de código abierto escrito en Java que proporciona una API RESTful para el cálculo de rutas optimizadas. La solución está diseñada para ser rápida, eficiente en memoria y fácil de integrar en aplicaciones web y móviles. Una de las características distintivas de GraphHopper es su capacidad para ofrecer enrutamiento basado en múltiples perfiles de vehículo, incluyendo automóviles, bicicletas, peatones y vehículos personalizados, lo cual resulta relevante para un servicio de emergencias médicas que puede requerir configuraciones específicas para ambulancias.

La arquitectura del servicio está optimizada para responder solicitudes de enrutamiento en tiempos reducidos, aprovechando algoritmos de grafos eficientes que permiten calcular rutas complejas considerando restricciones viales, sentidos de circulación, y condiciones de la infraestructura vial. El motor utiliza datos de OpenStreetMap, lo que garantiza cobertura global y actualizaciones frecuentes de la red vial.

### Plan Gratuito y Condiciones de Uso

GraphHopper ofrece un plan gratuito diseñado para desarrolladores, proyectos académicos y pruebas de concepto. Este plan permite acceder a la API de enrutamiento sin costo inicial y sin requerir tarjeta de crédito para el registro. Las limitaciones del plan gratuito están orientadas a prevenir uso comercial a gran escala, pero son completamente adecuadas para proyectos demostrativos y de investigación universitaria.

El acceso al servicio gratuito requiere registro previo para obtener una clave API, la cual debe incluirse en cada solicitud. No existen límites estrictos publicados de solicitudes diarias para el nivel básico, aunque el servicio implementa controles de tasa para garantizar la estabilidad de la plataforma compartida. Para el contexto de un proyecto universitario demostrativo, estas condiciones son suficientes para desarrollar y validar la funcionalidad completa del sistema de enrutamiento.

### Autenticación y Seguridad

La autenticación se gestiona mediante API Key que debe transmitirse como parámetro de consulta en cada solicitud a los endpoints de la API. Todas las comunicaciones deben realizarse sobre HTTPS para garantizar la confidencialidad de los datos transmitidos, incluyendo las coordenadas de ubicación que pueden considerarse sensibles en el contexto de emergencias médicas.

GraphHopper no documenta explícitamente el soporte para CORS en su plan gratuito, lo que sugiere que las solicitudes directas desde navegadores web pueden enfrentar restricciones. Esta característica hace recomendable la implementación de un backend intermediario que gestione las comunicaciones con la API, centralizando la autenticación y permitiendo mayor control sobre las solicitudes realizadas.

### Documentación y Facilidad de Integración

La documentación de GraphHopper es extensa y está bien organizada, con ejemplos de solicitud y respuesta para cada endpoint disponible. Los endpoints principales incluyen cálculo de rutas punto a punto, matrices de distancia y tiempo, geocodificación inversa, y optimización de rutas múltiples. Cada endpoint cuenta con parámetros configurables que permiten ajustar el comportamiento del enrutamiento según las necesidades específicas del caso de uso.

La API sigue convenciones REST estándar, utilizando verbos HTTP apropiados y formatos JSON para las respuestas. Esto facilita la integración con cualquier lenguaje de programación o framework moderno. Los mensajes de error son descriptivos y ayudan a identificar problemas de configuración o uso incorrecto de los parámetros.

### Consideraciones para el Proyecto

Para nosotros, GraphHopper representa una opción sólida debido a su plan gratuito accesible, documentación completa y arquitectura bien diseñada. La posibilidad de configurar perfiles de vehículo personalizados podría aprovecharse en el futuro para optimizar rutas considerando las características específicas de las ambulancias, como peso, altura o equipamiento especial.

**Fuente oficial:** https://www.graphhopper.com/pricing/ y https://docs.graphhopper.com/

---

## 2. OpenRouteService

### Descripción General y Arquitectura

OpenRouteService es un servicio de enrutamiento basado en datos de OpenStreetMap, desarrollado y mantenido por el grupo de investigación GIScience de la Universidad de Heidelberg en Alemania. El servicio está diseñado para proporcionar APIs de enrutamiento, isocronas y matrices de distancia con enfoque académico y de investigación, lo que lo hace particularmente adecuado para proyectos universitarios.

La plataforma utiliza el motor de enrutamiento openrouteservice, que es de código abierto y está construido sobre la biblioteca GraphHopper. Esto significa que comparte muchas características técnicas con GraphHopper, pero ofrece una capa de servicio gestionado con políticas de uso específicas. El servicio soporta múltiples perfiles de transporte incluyendo conducción, ciclismo, caminata y vehículos de emergencia, este último siendo especialmente relevante para el caso de uso de emergencias médicas.

### Plan Gratuito y Condiciones de Uso

OpenRouteService mantiene uno de los planes gratuitos más generosos disponibles en el mercado para servicios de enrutamiento gestionados. El plan estándar gratuito no requiere tarjeta de crédito y proporciona límites de uso que son adecuados para proyectos de desarrollo, investigación y demostración académica.

Los límites del plan gratuito están definidos por tipo de endpoint, con asignaciones diarias que se renuevan cada veinticuatro horas. Las solicitudes de enrutamiento de direcciones tienen la asignación más alta, seguidas por isocronas y matrices. El servicio está diseñado para permanecer gratuito para usuarios individuales y proyectos académicos de forma indefinida, lo que proporciona estabilidad para el desarrollo a largo plazo del proyecto.

### Autenticación y Seguridad

El servicio requiere autenticación mediante API Key que debe incluirse en el encabezado de Autorización de cada solicitud HTTP. Todas las comunicaciones se realizan sobre HTTPS para garantizar la seguridad de los datos. Sin embargo, existen reportes documentados de problemas con CORS cuando se intenta acceder a la API directamente desde aplicaciones web en el navegador, lo que puede generar errores de políticas de origen cruzado.

Esta limitación técnica hace recomendable la implementación de un backend intermediario que gestione las solicitudes a la API, similar a lo recomendado para GraphHopper. El backend puede centralizar la gestión de credenciales y evitar exponer las claves API en el código del frontend.

### Documentación y Facilidad de Integración

La documentación de OpenRouteService es completa también y está disponible en línea con ejemplos detallados para cada endpoint. Los endpoints principales incluyen cálculo de rutas, generación de isocronas, matrices de tiempo y distancia, geocodificación y autocompletado de direcciones. Cada endpoint cuenta con parámetros configurables que permiten ajustar el comportamiento del servicio según las necesidades del proyecto.

La API sigue estándares REST con respuestas en formato JSON. Los códigos de error HTTP son utilizados apropiadamente para indicar el estado de las solicitudes, y los mensajes de error incluyen información suficiente para diagnosticar problemas comunes de integración.

### Consideraciones para el Proyecto

OpenRouteService es una alternativa sólida a GraphHopper, con la ventaja de tener un plan gratuito con límites más generosos y un enfoque académico que se alinea bien con proyectos universitarios. El soporte para perfiles de vehículos de emergencia es una característica diferenciadora que podría aprovecharse para optimizar rutas considerando las prioridades y restricciones específicas de las ambulancias.

**Fuente oficial:** https://openrouteservice.org/plans/ y https://openrouteservice.org/dev/

---

## 3. Google Maps Routes API

### Descripción General y Arquitectura

Google Maps Routes API es parte de Google Maps Platform y proporciona capacidades avanzadas de cálculo de rutas con acceso a datos de tráfico en tiempo real, información de peajes, y condiciones viales actualizadas. La API está diseñada para aplicaciones que requieren la máxima precisión en estimaciones de tiempo de viaje y condiciones de ruta dinámicas.

La infraestructura de Google Maps es la más extensa a nivel global, con cobertura en prácticamente todos los países y regiones habitadas. Los datos de tráfico se actualizan continuamente a partir de múltiples fuentes, incluyendo dispositivos móviles, sensores y reportes de usuarios, lo que proporciona estimaciones de tiempo de viaje altamente precisas en condiciones de tráfico variables.

### Plan Gratuito y Condiciones de Uso

Google Maps Platform opera bajo un modelo de crédito mensual que se aplica al uso de todas sus APIs. Históricamente, Google ha proporcionado un crédito mensual gratuito que puede utilizarse para cubrir el uso de las APIs de enrutamiento. Sin embargo, las condiciones específicas del crédito gratuito han variado con el tiempo y están sujetas a cambios por parte de Google sin notificación previa.

El pricing de la Routes API varía según las características específicas utilizadas en cada solicitud, con niveles básicos, avanzados y premium que ofrecen diferentes funcionalidades. Para un proyecto como el nuestro, el crédito gratuito mensual puede ser suficiente para desarrollar y validar la funcionalidad, pero existe el riesgo de exceder los límites si el uso aumenta o si se habilitan características de mayor costo.

### Autenticación y Seguridad

La autenticación se gestiona mediante API Keys creadas y administradas desde la consola de Google Cloud Platform. Las claves pueden configurarse con restricciones de dominio, IP y APIs específicas para mejorar la seguridad. Todas las solicitudes deben realizarse sobre HTTPS.

Una limitación importante es que la Routes API no permite solicitudes directas desde navegadores web debido a restricciones de CORS. Esto obliga a implementar un backend intermediario para cualquier integración, sin excepción. Las claves API expuestas en código frontend pueden ser comprometidas y generar uso no autorizado que se facture a la cuenta.

### Documentación y Facilidad de Integración

La documentación de Google Maps Platform es extensa y está bien mantenida, con guías de inicio rápido, referencias completas de API, y ejemplos de código para múltiples lenguajes de programación. La plataforma ofrece SDKs nativos para Android, iOS y web que facilitan la integración en aplicaciones móviles y web.

Sin embargo, la complejidad de la plataforma puede ser too much para nosotros. La consola de Google Cloud tiene una curva de aprendizaje significativa, y la gestión de facturación, límites y claves API requiere atención constante para evitar cargos inesperados.

### Consideraciones para el Proyecto

 Google Maps Routes API puede ser excesivo en términos de complejidad y riesgo de costos. La obligatoriedad de usar backend intermediario y la posibilidad de generar cargos si se excede el crédito gratuito son factores que deben considerarse cuidadosamente. La precisión superior de los datos de tráfico puede no justificar la complejidad adicional para un proyecto de carácter académico.

**Fuente oficial:** https://developers.google.com/maps/documentation/routes/usage-and-billing

---

## 4. Mapbox Directions API

### Descripción General y Arquitectura

Mapbox Directions API es un servicio de enrutamiento que proporciona cálculo de rutas con soporte para múltiples modos de transporte. La plataforma está diseñada para desarrolladores que buscan alternativas a Google Maps con mayor flexibilidad de personalización y modelos de precios transparentes.

Mapbox utiliza datos de OpenStreetMap complementados con fuentes propietarias para mejorar la precisión y cobertura. La plataforma ofrece herramientas de diseño de mapas personalizados que permiten crear experiencias visuales únicas, lo que puede ser atractivo para proyectos que buscan diferenciación en la presentación de rutas y ubicaciones.

### Plan Gratuito y Condiciones de Uso

Mapbox ofrece un plan gratuito con límites mensuales generosos que se renuevan cada mes. El plan free incluye una asignación sustancial de solicitudes para la Directions API, suficiente para proyectos de desarrollo, pruebas y demostraciones de escala moderada. Los límites están definidos por producto, lo que significa que el uso de una API no afecta la asignación de otras.

El plan gratuito no requiere tarjeta de crédito para el registro, lo que elimina el riesgo de cargos accidentales. Sin embargo, los límites mensuales pueden ser insuficientes para proyectos que escalen rápidamente o que requieran alto volumen de solicitudes de enrutamiento.

### Autenticación y Seguridad

La autenticación se gestiona mediante Access Tokens que pueden crearse y gestionarse desde la cuenta de Mapbox. Los tokens pueden configurarse con restricciones de dominio y URLs de referencia para mejorar la seguridad. A diferencia de Google Maps, Mapbox soporta CORS para uso directo desde navegadores web, lo que permite integraciones frontend sin backend intermediario si se desea.

Todas las comunicaciones se realizan sobre HTTPS. Las mejores prácticas de seguridad recomiendan rotar tokens periódicamente y utilizar tokens con restricciones específicas para cada entorno de desarrollo.

### Documentación y Facilidad de Integración

La documentación de Mapbox es moderna y bien organizada, con guías interactivas, ejemplos de código y playgrounds para probar solicitudes directamente desde el navegador. La plataforma ofrece SDKs nativos para múltiples plataformas incluyendo Android, iOS, JavaScript, Unity y React Native.

La API sigue estándares REST con respuestas en formato GeoJSON, lo que facilita la integración con bibliotecas de mapeo populares como Leaflet y Mapbox GL JS. Los mensajes de error son claros y ayudan a identificar problemas de configuración rápidamente.

### Consideraciones para el Proyecto

Mapbox es una alternativa viable con buen soporte para desarrollo frontend directo. Sin embargo, para un proyecto universitario que prioriza simplicidad y documentación clara, GraphHopper y OpenRouteService ofrecen experiencias más enfocadas en el caso de uso de enrutamiento puro sin la complejidad adicional de la plataforma completa de Mapbox.

**Fuente oficial:** https://www.mapbox.com/pricing

---

## 5. OSRM (Open Source Routing Machine)

### Descripción General y Arquitectura

OSRM es un motor de enrutamiento de código abierto de alto rendimiento escrito en C++14, diseñado específicamente para ejecutarse sobre datos de OpenStreetMap. El motor está optimizado para velocidad y puede manejar grandes volúmenes de solicitudes de enrutamiento con latencias muy bajas.

La arquitectura de OSRM está diseñada para pre-procesar datos de OpenStreetMap y crear índices optimizados que permiten cálculos de ruta extremadamente rápidos. El motor es utilizado como base por varios servicios de enrutamiento comerciales y de código abierto, incluyendo versiones anteriores de OpenRouteService.

### Plan Gratuito y API Pública

Existe una API pública hospedada por el proyecto OSRM, pero está destinada principalmente para pruebas, desarrollo y uso limitado. La política de uso explícitamente indica que la API pública no debe utilizarse para aplicaciones de producción o servicios comerciales debido a la falta de garantías de disponibilidad y rendimiento.

No existen límites estrictos documentados, pero el servicio implementa controles de tasa para proteger la infraestructura compartida. El uso intensivo puede resultar en bloqueo temporal de las solicitudes o degradación del servicio.

### Autenticación y Seguridad

La API pública no requiere autenticación, lo que significa que cualquier usuario puede realizar solicitudes sin registro previo. Esto facilita las pruebas iniciales pero presenta riesgos para producción, ya que no hay control sobre el uso ni capacidad de auditar las solicitudes realizadas.

Las comunicaciones pueden realizarse sobre HTTP o HTTPS dependiendo de la configuración del endpoint utilizado. Para aplicaciones que manejan datos sensibles, se recomienda siempre utilizar HTTPS.

### Documentación y Facilidad de Integración

La documentación de OSRM está disponible en el repositorio del proyecto. Los endpoints están documentados con ejemplos de solicitud y respuesta, pero la documentación es más técnica y menos orientada a desarrolladores que las alternativas comerciales.

La API sigue convenciones REST simples con respuestas en formato JSON. La integración es directa pero requiere mayor conocimiento técnico para configurar y optimizar correctamente las solicitudes.

### Consideraciones para el Proyecto

Para nosotros, la API pública de OSRM puede ser útil para pruebas iniciales, pero no se recomienda para desarrollo serio debido a la falta de garantías de disponibilidad. La inestabilidad potencial del servicio podría afectar la demostración del proyecto en momentos críticos.

**Fuente oficial:** https://project-osrm.org/docs/v5.24.0/api/

---

## 6. Waze

### Descripción General y Arquitectura

Waze es una aplicación de navegación propiedad de Google que proporciona información de tráfico en tiempo real basada en reportes de la comunidad de usuarios. La plataforma es conocida por su capacidad para detectar incidentes viales, congestión y condiciones de tráfico dinámicas.

A diferencia de las otras APIs evaluadas, Waze no está diseñado como una plataforma de desarrollo para terceros. Su enfoque principal es la aplicación móvil para usuarios finales, con capacidades limitadas para integración externa.

### Plan Gratuito y Disponibilidad de API

Waze no ofrece una API pública completa para cálculo de rutas programático. Las únicas capacidades disponibles para desarrolladores externos son los Deep Links, que permiten redirigir usuarios a la aplicación de Waze para navegación, y el Transport SDK, que está dirigido a socios específicos y tiene funcionalidades limitadas.

No existe un plan gratuito para APIs de enrutamiento porque simplemente no hay una API pública disponible para ese propósito. Las soluciones de terceros que ofrecen acceso a datos de Waze no están respaldadas oficialmente y pueden dejar de funcionar sin aviso.

### Autenticación y Seguridad

Los Deep Links de Waze no requieren autenticación, ya que funcionan como URLs que abren la aplicación instalada en el dispositivo del usuario. El Transport SDK requiere registro y aprobación por parte de Waze, con procesos de autenticación específicos para cada socio.

### Documentación y Facilidad de Integración

La documentación para desarrolladores de Waze es limitada y se centra principalmente en los Deep Links. No hay referencia completa de API para cálculo de rutas desde servidores externos, ya que esta funcionalidad no está disponible públicamente.

### Consideraciones para el Proyecto

Waze no es una opción viable para este proyecto debido a la falta de API de enrutamiento completa. Los Deep Links pueden ser útiles como funcionalidad complementaria para permitir que los paramédicos abran rutas en la aplicación Waze, pero no pueden servir como solución principal de cálculo de rutas.

**Fuente oficial:** https://developers.google.com/waze

---

## Tabla Comparativa de APIs de Enrutamiento

| Característica | GraphHopper | OpenRouteService | Google Maps | Mapbox | OSRM | Waze |
|---------------|-------------|------------------|-------------|--------|------|------|
| Código Abierto | Sí | Sí | No | No | Sí | No |
| Plan Gratuito | Sí | Sí | Sí (crédito) | Sí | Sí (limitado) | No |
| Auto-alojable | Sí | Sí | No | No | Sí | No |
| Autenticación | API Key | API Key | API Key | Token | Ninguna | N/A |
| Documentación | Completa | Completa | Extensa | Moderna | Técnica | Limitada |
| Perfil Emergencia | Configurable | Sí disponible | Sí | Sí | Configurable | N/A |

---

## Análisis de Arquitectura: Backend como Intermediario

### Seguridad y Gestión de Credenciales

Uno de los argumentos más sólidos a favor del backend intermediario es la protección de las credenciales de autenticación. Cuando el frontend consulta directamente las APIs externas, las claves API o tokens de acceso deben estar disponibles en el código del cliente, lo que crea vulnerabilidades de seguridad. Las credenciales expuestas pueden ser extraídas, compartidas o utilizadas de manera no autorizada, potencialmente generando consumo de cuota que se facture a la cuenta del proyecto o comprometiendo el acceso al servicio.

Centralizar la autenticación en el backend permite mantener las credenciales en un entorno controlado, accesible solo por el servidor. El frontend se comunica con el backend utilizando mecanismos de autenticación propios del sistema (sesiones, tokens JWT, etc.), sin exponer las claves de las APIs externas. Esta separación de responsabilidades es una práctica estándar en desarrollo de software que mejora la postura de seguridad general del sistema.

### Trazabilidad y Auditoría

Para un sistema de emergencias médicas, incluso de carácter demostrativo, la capacidad de auditar las operaciones realizadas es fundamental. Cuando el backend actúa como intermediario, cada solicitud de enrutamiento puede registrarse con metadatos completos: timestamp, coordenadas de origen y destino, ruta calculada, tiempo estimado, proveedor utilizado, y resultado de la solicitud.

Esta trazabilidad permite análisis posteriores sobre patrones de uso, rendimiento del sistema, y validación de la lógica de negocio. En un contexto académico, estos datos pueden utilizarse para generar métricas y visualizaciones que demuestren el funcionamiento del sistema durante la presentación del proyecto. La pérdida de esta capacidad de auditoría sería una desventaja significativa si se optara por consultas directas desde el frontend.

### Resiliencia y Fallback entre Proveedores

Implementar el backend como intermediario permite crear una capa de abstracción sobre las APIs de enrutamiento externas. Esta abstracción habilita funcionalidades avanzadas como el fallback automático entre proveedores: si GraphHopper no responde o excede sus límites, el backend puede transparentemente intentar con OpenRouteService sin que el frontend o el usuario final experimenten interrupciones.

Esta capacidad de resiliencia es particularmente valiosa para demostraciones públicas del proyecto, donde la disponibilidad del sistema debe garantizarse. Un fallo en la API externa no debería resultar en un fallo visible del sistema completo si existe una alternativa configurada en el backend.

### Consideraciones de Latencia

Es cierto que añadir el backend como intermediario introduce latencia adicional en cada solicitud de enrutamiento. La solicitud debe viajar del frontend al backend, del backend a la API externa, y regresar por el mismo camino. Sin embargo, esta latencia adicional se mide típicamente en decenas o cientos de milisegundos, lo cual es insignificante comparado con el tiempo total de operación de un sistema de emergencias.

Para un proyecto demostrativo como el nuestro, esta diferencia de latencia no es perceptible para los usuarios y no afecta la experiencia de uso. El valor agregado en términos de seguridad, trazabilidad y resiliencia justifica ampliamente la mínima penalización de rendimiento.


---

## Conclusión

Para nuestro proyecto de sistema de emergencias médicas, el uso de GraphHopper u OpenRouteService, con backend intermediario, podría proporcionar un buen balance entre facilidad de desarrollo, costos cero, funcionalidad y resiliencia operativa. Esta configuración permite concentrar los esfuerzos del equipo en la lógica de negocio y la experiencia de usuario, sin preocupaciones significativas sobre infraestructura, costos o disponibilidad del servicio de enrutamiento.

---

### Fuentes Consultadas

1. GraphHopper Pricing y Documentation: https://www.graphhopper.com/pricing/ y https://docs.graphhopper.com/
2. OpenRouteService Plans y API: https://openrouteservice.org/plans/ y https://openrouteservice.org/dev/
3. Google Maps Routes API: https://developers.google.com/maps/documentation/routes/usage-and-billing
4. Mapbox Pricing: https://www.mapbox.com/pricing
5. OSRM Documentation: https://project-osrm.org/docs/v5.24.0/api/
6. Waze Developers: https://developers.google.com/waze