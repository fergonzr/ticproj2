
# Reporte de investigación: frameworks de desarrollo móvil

El desarrollo móvil será un componente esencial dentro del proyecto. En vista de esto, en el presente documento se comparan distintos frameworks de desarrollo móvil a utilizar en el proyecto. Se realiza una presentación de cada uno, y se argumenta respecto a su viabilidad dentro del proyecto, a la luz de criterios como la facilidad del desarrollo en este, la familiaridad del equipo con este, su rendimiento y su sopote.


### Frameworks investigados  
- [React Native](https://reactnative.dev/)
- [Flutter](https://flutter.dev/)
- [NativeScript](https://nativescript.org/)

### Presentación de los frameworks  

#### React Native  
React Native permite desarrollar aplicaciones móviles usando JavaScript/TypeScript, con un enfoque en reutilización de código entre plataformas. Su integración con React facilita el desarrollo de interfaces dinámicas y su comunidad es amplia, lo que garantiza soporte y recursos. Sin embargo, su rendimiento en ciertas tareas puede ser inferior al de soluciones nativas.  

#### Flutter  
Flutter utiliza el lenguaje Dart y genera interfaces nativas para Android e iOS. Ofrece un rendimiento óptimo y una experiencia de desarrollo fluida, pero requiere aprender un lenguaje nuevo (Dart) y tiene una curva de aprendizaje más pronunciada.  

#### NativeScript  
NativeScript permite usar JavaScript o TypeScript para desarrollar aplicaciones nativas, manteniendo la sintaxis familiar para desarrolladores con experiencia en React. Sin embargo, su comunidad es más limitada que la de React Native, y su rendimiento puede verse afectado en aplicaciones complejas.  

### Evaluación comparativa  

| Criterio          | React Native | Flutter | NativeScript |  
|-------------------|--------------|---------|--------------|  
| **Facilidad de desarrollo** | 4           | 3       | 4            |  
| **Familiaridad del equipo** | 5 (1)     | 2       | 3            |  
| **Comunidad y soporte** | 5          | 4       | 3            |  
| **Adaptabilidad a necesidades** | 4       | 3       | 4            |  
| **Puntuación total**  | **4.5**     | **3.5** | **3.5**     |  

**Notas:**  
1. El equipo ya tiene experiencia con React y JavaScript, lo que facilita la adopción de React Native.  

### Veredicto  
Dado que el equipo posee experiencia en React y JavaScript, **React Native** se selecciona por su **facilidad de uso**, **alta familiaridad** y **amplia comunidad**, lo que acelera el desarrollo y reduce la curva de aprendizaje. Aunque Flutter ofrece rendimiento superior, su complejidad y la necesidad de aprender un nuevo lenguaje lo hacen menos adecuado para este proyecto. NativeScript, por su parte, no compensa la menor comunidad y adaptabilidad.  

**Decisión final:** Implementar **React Native** como framework de desarrollo móvil.
