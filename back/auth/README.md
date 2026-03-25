# sie_auth

Este paquete tiene dos funciones dentro del sistema de SIE.

1. Proveer un **servicio** de autenticación basado en Oauth2 mediante HTTP REST, con el que un cliente puede obtener tokens para acceder a recursos de estos servicios. Este se define en `src/sie_auth/rest.py`.
2. Una **librería** con el que otros servicios pueden autorizar usuarios verificando estos tokens, en `src/sie_auth/lib.py`.

## El servicio

El servicio define dos endpoints:

- `/api/v1/auth/token`: para obtener tokens JWT. Opcionalmente, puedes indicar el rol de usuario con el cual quieres iniciar sesión en el parámetro `role` de la URL. Para peticiones http subsiguientes, se debe añadir `Authorization: Bearer {token}` a los encabezados de la petición para obtener autorización.
- `/api/v1/auth/whoami`: para obtener el usuario que tiene la sesión iniciada.

## La librería

La librería define funciones para verificar la validez de un token y el usuario asociado a este. Para este fin, está:

```python
def get_user_in_token(token: str) -> User | None:
```

Que permite obtener un usuario en base a un token, o `None` si el token no es válido.
No obstante, como el proyecto está mayormente basado en FastAPI, se define una dependencia que simplifica esto, llamada `get_current_user`, la cual se puede inyectar en cualquier endpoint definido (excepto Websockets, en ese sí se debe llamar a la función `get_user_in_token`).
