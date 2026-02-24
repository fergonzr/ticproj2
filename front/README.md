# Sistema Integrado de Emergencias - Aplicación Móvil

## Ejecutar el proyecto

1. Instalar las dependencias

   ```bash
   npm install
   ```

2. Ejecutar la aplicación con expo

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Construir la documentación

La documentación para este proyecto se puede autogenerar con [TypeDoc](https://typedoc.org/):

```bash
npx typedoc
```

Esto genera la documentación completa en el directorio `docs/`. Abre `docs/index.html` con tu navegador de preferencia para comenzar a leerla.
Cuando estés desarrollando, no te olvides de documentar lo que más puedas agregando docstrings a las clases, funciones, enums, etc. Puedes ver ejemplos de docstrings en el [Github de Typedoc](https://github.com/TypeStrong/typedoc/tree/master/example). Si necesitas una referencia completa, el estándar [TSDoc](https://tsdoc.org/) te lo da.

## Más información

Se recomienda familiarizarse con las siguientes tecnologías para comenzar a desarrollar la aplicación:

- [Expo documentation](https://docs.expo.dev/): Todo el framework para ejecutar y desarrollar la aplicación en general.
- [React Native Element](https://reactnativeelements.com/): Librería de componentes pre-desarrollados y fáciles de estilizar.
- [TailwindCSS](https://tailwindcss.com/): Framework de CSS que hace nuestras vidas más sencillas.
- [TypeDoc](https://typedoc.org/): Auto-generador de documentación.
