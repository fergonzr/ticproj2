# Frameworks de testing en el proyecto

En el presente documento se listan las herramientas de automatización de pruebas que se utilizarán a lo largo del proyecto.
Al tener dos bases de código distintas (backend y frontend) escritas en lenguajes (Python y TypeScript) y frameworks distintos (FastAPI y React Native), se detallarán, por separado, las herramientas para cada una.
Estas serán utilizadas para comprobar la calidad del producto en todo momento del desarrollo, incluyendo pruebas unitarias, pruebas de integración y pruebas end-to-end.

## Backend (Python/FastAPI)

**Herramientas a utilizar:** pytest y Starlette.

[pytest](https://docs.pytest.org/en/stable/) es un framework de testing para python the se enfoca en la legibilidad y escalabilidad de las pruebas. [Starlette](https://www.starlette.dev/testclient/), en cambio, es una librería ligera para construir servicios web, y es la librería de la cual *FastAPI* se basa para proveer toda su funcionalidad. Esta contiene una clase, llamada `TestClient`, que permite realizar peticiones contra aplicaciones enteras hechas en *FastAPI*, lo cual simplificará el testing end-to-end.

La integración de **Starlette** y **pytest** en proyectos FastAPI se fundamenta en su diseño modular y su alineación con las características nativas de FastAPI [1], lo que facilita la implementación de pruebas automatizadas de forma eficiente y escalable. A continuación, se detallan las razones principales que respaldan esta elección:  

1. **Integración nativa con FastAPI**  
FastAPI utiliza **Starlette** como base para su infraestructura de servidores, lo que permite una sincronización directa entre el framework y las herramientas de prueba. El **TestClient** de FastAPI, basado en Starlette, simplifica la creación de casos de prueba al simular solicitudes HTTP de manera intuitiva, sin requerir configuraciones complejas [2]. Además, el soporte para pruebas asíncronas (async/await) permite validar funcionalidades no bloqueantes, típicas en APIs modernas.  

2. **Facilidad de uso y familiaridad**  
**pytest** es un framework de pruebas de código abierto ampliamente adoptado en la comunidad Python [3], lo que garantiza una curva de aprendizaje baja y una gran cantidad de recursos disponibles. Su sintaxis minimalista y la capacidad de integrar fixtures facilitan la escritura de pruebas repetibles y mantenibles. Además, HTTPX (la biblioteca subyacente de Starlette) replica la API de Requests, lo que permite a los desarrolladores aprovechar su conocimiento previo sin necesidad de adaptaciones significativas [1].  

3. **Soporte para pruebas avanzadas**  
La combinación de Starlette y pytest permite pruebas de dependencias, sobrecargas de configuraciones y validaciones de endpoints con aserciones precisas. Por ejemplo, se pueden mockear servicios externos (como bases de datos o APIs de terceros) para aislar los casos de prueba y asegurar la estabilidad del sistema.  

4. **Escalabilidad y rendimiento**  
FastAPI y Starlette están optimizados para manejar cargas de trabajo altas, lo que se refleja en la capacidad de pytest para ejecutar pruebas en paralelo y generar reportes detallados. Esto es crucial para proyectos que requieren garantizar la calidad del backend antes de su despliegue en entornos productivos.  

## Frontend (TypeScript/React Native)

**Herramienta a utilizar:** Jest

Jest es un framework de pruebas de código abierto diseñado para
JavaScript y TypeScript, ampliamente utilizado en el desarrollo web y
móvil. Ofrece características como pruebas unitarias, integración
con bibliotecas como React Testing Library, y soporte para mocks y
snapshots. Su popularidad se debe a su facilidad de uso, comunidad activa
y capacidad para automatizar pruebas en proyectos como React Native.

La elección de **Jest** como framework de testing para el frontend en
React Native se fundamenta principalmente en su integración nativa
con **Expo**, el framework de desarrollo para React Native, y en
su estatus como herramienta de testing más popular en la comunidad
de JavaScript/TypeScript. A continuación, se detallan las razones
principales que respaldan esta decisión:

1. **Integración nativa con Expo**  
Jest es el framework de testing predeterminado en Expo, lo que permite
una configuración rápida y sencilla para proyectos basados en este
entorno. Esto reduce la curva de aprendizaje y facilita la escritura
de pruebas unitarias, de componentes y de integración, aprovechando
funcionalidades como el mockeo de dependencias y la simulación de
entornos.

2. **Popularidad y comunidad**  
Jest es ampliamente adoptado en la comunidad de desarrollo web,
lo que garantiza una gran cantidad de recursos, plugins y ejemplos
disponibles. Su sintaxis sencilla y la capacidad de generar reportes
detallados de errores hacen que sea una opción eficiente para mantener
la calidad del código en proyectos React Native.

3. **Soporte para TypeScript**  
Jest ofrece excelente soporte para TypeScript, incluyendo la
inferencia de tipos en pruebas y la detección de errores en tiempo de
compilación. Esto es crucial para proyectos que utilizan TypeScript,
ya que permite identificar problemas antes de la implementación.

4. **Escalabilidad y rendimiento**  
Jest permite la ejecución de pruebas en paralelo y la integración
con herramientas como **React Testing Library**, lo que facilita
la validación de componentes y el flujo de usuario en aplicaciones
móviles complejas.

## Referencias
1. [Tutorial de testing para FastAPI](https://fastapi.tiangolo.com/tutorial/testing/)
2. [Documentación de Testclient en Starlette](https://www.starlette.dev/testclient/)
3. [Documentación de PyTest](https://docs.pytest.org/en/stable/)
4. [Jest](https://jestjs.io/)
