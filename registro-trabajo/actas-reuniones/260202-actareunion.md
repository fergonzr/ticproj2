# Acta de Reunión – Socialización de Avances y Presentación de Idea

**Semestre:** 2026-1  
**Fecha:** 2/02/2026

## Asistentes del encuentro presencial
- Juan Esteban Paez Gil  
- Isabela Arrubla Orozco  
- Fernando González Rivero  
- Samuel Betancur Muñoz  

## Objetivos de la reunión

La reunión tuvo como propósito principal **socializar los avances individuales derivados de los compromisos asignados en la sesión anterior** y **presentar formalmente la idea del proyecto ante el grupo y la docente**, con el fin de recibir retroalimentación técnica, funcional y estratégica que permita ajustar el enfoque antes de avanzar a fases de diseño detallado.

## Temas tratados

Durante la sesión, cada miembro del equipo compartió los resultados de sus investigaciones. Se socializaron opciones de gestores de paquetes en Python (como Poetry y Pipenv), destacando sus ventajas en términos de reproducibilidad y gestión de dependencias. También se abordó de forma preliminar la discusión sobre el modelo de base de datos, evaluando si el sistema requerirá una solución **SQL, NoSQL o híbrida**. Aunque no se tomó una decisión definitiva, se identificó que distintos componentes del sistema (por ejemplo, registros estructurados de emergencias vs. datos geoespaciales o logs en tiempo real) podrían beneficiarse de enfoques diferentes, lo que plantea la necesidad de definir con claridad el grado de flexibilidad arquitectónica requerido.

Además, se revisaron posibles **algoritmos de enrutamiento** para la asignación óptima de recursos: se mencionaron alternativas como **0-1 BFS**, **Dijkstra** y **A\***, considerando factores como complejidad computacional, capacidad de manejar múltiples pesos (distancia, tráfico, gravedad) y adaptabilidad a escenarios dinámicos. Esta discusión se mantuvo conceptual, dejando su profundización para etapas posteriores de diseño técnico.

Posteriormente, el equipo realizó la **sustentación de la idea del proyecto** ante el curso. La docente brindó una retroalimentación clave que orientará los próximos pasos. Entre los puntos destacados están:

- El proyecto **no debe depender de la disponibilidad de infraestructura ni de datos reales de entidades externas** (como hospitales o el CRUE). En cambio, debe **vender una funcionalidad clara**, diseñada para operar con información **parametrizada y simulada** si es necesario. 
- Es fundamental **definir un alcance preciso**, explicitando los límites del sistema: qué hace, qué no hace, y hasta dónde llega la responsabilidad del equipo. Esto incluye delimitar claramente la interacción con actores externos sin asumir control sobre sus sistemas.
- Se reforzó la importancia de considerar aspectos **legales y éticos**, especialmente en torno al trabajo en equipo y manejo de datos sensibles incluso en un entorno de prototipo.

## 3. Compromisos acordados

Como único compromiso prioritario para los próximos días, el equipo se preparará para una **posible reunión con potenciales clientes o expertos del dominio**, quienes podrían aportar una visión más profunda del negocio, los flujos reales de atención y las necesidades no explícitas del ecosistema de emergencias. Esta conversación será clave para validar supuestos y enriquecer el diseño centrado en el usuario.
