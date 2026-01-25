# Reporte de investigación: herramientas de generación de documentación automática

En el presente documento se discute acerca de las herramientas de documentación autogenerada para el proyecto. Se realiza una presentación de cada una de estas, y se argumenta respecto a su viabilidad para ser usada dentro del desarrollo del producto.

La documentación va a ser un área clave dentro del producto, puesto que esta permitirá comunicar, mediante un lenguaje natural, el uso y funcionamiento del software a diseñar.

**Herramientas investigadas:**

- [Sphinx](https://www.sphinx-doc.org/en/master/index.html)
- [Mkdocs](https://www.mkdocs.org/)
- [TypeDoc](https://typedoc.org/)

Todas ellas sirven para generar sitios web (contenido HTML) desde docstrings directamente en el código fuente, y algo de lenguajes de marcado complementarios para documentación narrativa.

## Presentación de las herramientas

### Sphinx

Sphinx ayuda a generar documentación para proyectos de software escritos en Python, primariamente (el soporte para incluir extraer de otros lenguajes parece limitado).
Este utiliza la notación [reStructuredText](https://en.wikipedia.org/wiki/ReStructuredText) para este propósito, aunque otros formatos también tienen algo de soporte.

Sphinx es un generador extremadamente poderoso, más enfocado a proyectos complejos y de gran tamaño, de allí que sea utilizado para la documentación del lenguaje Python en sí y del kernel Linux.

### Mkdocs

Mkdocs cubre a grandes rasgos el mismo propósito que Sphinx, pero se enfoca en ser rápido y simple. Esto hace que tenga una curva de aprendizaje más suave que Sphinx, especialmente teniendo en cuenta que utiliza Markdown como formato de marcado.
También tiene otras características que facilitan su uso, tal como la previsualización de la documentación en tiempo real.

### TypeDoc

Ambos de los anteriores son utilizados principalmente por proyectos escritos en Python.
TypeDoc, por el contrario, funciona para el otro lenguaje de programación primario del proyecto, TypeScript.
TypeDoc también utiliza Markdown para el formato de la documentación narrativa (documentación NO generada automáticamente del código fuente), y es bastante sencillo de instalar como un módulo de npm.

## Comparación de las herramientas

Si bien sería ideal utilizar una única herramienta tanto para la documentación de ambas bases de código, no fue encontrada ninguna capaz de operar de manera confiable sobre estos dos lenguajes de programación.
Como tal, se deberá escoger dos herramientas, una para Python, otra para TypeScript.

Se tomarán los siguientes criterios para realizar la comparativa:

- Facilidad de uso
- Familiaridad con los formatos utilizados
- Tamaño de la comunidad
- Adaptabilidad

A continuación se le asigna un puntaje, en la escala de 1 a 5 a cada una de estas herramientas para cada uno de estos criterios:

| Criterio      | Sphinx | MkDocs  | TypeDoc |
| ------------- | ------ | ------- | ------- |
| Facilidad     | 3      | 4       | 5       |
| Familiaridad  | 2 (1)  | 5       | 4       |
| Comunidad     | 5      | 4       | 5       |
| Adaptabilidad | 5      | 4       | 3       |
| ------------- | ------ | ------- | ------- |
| Puntuación    | 3.75   | 4.25    | 4.25    |


**Notas:**

1. El equipo no está familiarizado con *reStructuredText* como sí lo está con Markdown.

## Veredicto

De acuerdo con las prioridades e intereses del proyecto, se propone utilizar **MkDocs** y **TypeDoc** para la documentación de este, gracias a su amplia comunidad, gran flexibilidad y sobretodo facilidad de uso.
