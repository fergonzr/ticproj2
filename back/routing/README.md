# Routing

Esta API actúa como un proxy entre la aplicación y el servicio de routing de **GraphHopper**. Expone un endpoint REST para calcular rutas en coche entre dos puntos geográficos, devolviendo la distancia, el tiempo estimado y la geometría de la ruta.

## Características

- Endpoint único: `GET /api/v1/routing`
- Parámetros vía query string (latitud/longitud de origen y destino)
- Respuesta en formato JSON con distancia (metros), tiempo (milisegundos) y lista de coordenadas `[lng, lat]`
- Integración con la API de GraphHopper usando credenciales propias

## Requisitos previos

- Python 3.9 o superior
- Una clave de API de [GraphHopper](https://www.graphhopper.com/) (plan gratuito disponible)

### Entorno
Crea un archivo .env en la raíz del proyecto o exporta las siguientes variables:
- URL_ROUTING	Base URL de la API de GraphHopper	https://graphhopper.com/api/1
- ROUTING_KEY	Tu clave de API de GraphHopper	 `tu_api_key_aqui`

---

## Endpoint

`GET /api/v1/routing`

Calcula la ruta entre dos coordenadas geográficas.

Ejemplo de petición

```
curl "http://localhost:8000/api/v1/routing?from_lat=40.416775&from_lon=-3.703790&to_lat=40.440750&to_lon=-3.710190"
```
Respuesta exitosa 

```
{
  "from_location": {
    "latitude": 40.416775,
    "longitude": -3.70379
  },
  "to_location": {
    "latitude": 40.44075,
    "longitude": -3.71019
  },
  "distance_m": 2735.12,
  "time_ms": 362000,
  "points": [
    [-3.70379, 40.416775],
    [-3.70421, 40.417123],
    ...
  ]
}
```


