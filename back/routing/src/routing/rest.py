"""REST API for the routing proxy service.

Exposes GET /api/v1/routing as a proxy to the GraphHopper Routing API.
Reads URL_ROUTING and ROUTING_KEY from environment variables.
"""

import logging
import os

import httpx
from fastapi import FastAPI, HTTPException, Query

from .models import LocationInput, RouteRequest
from .geometry import simplify_polyline
from core.domain.value_objects.location import Location

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

ROUTING_URL = os.environ["URL_ROUTING"]
#ROUTING_URL = "https://graphhopper.com/api/1"
ROUTING_KEY = os.environ["ROUTING_KEY"]

app = FastAPI()


@app.get("/api/v1/routing")
async def get_route(
    from_lat: float = Query(..., description="Origin latitude"),
    from_lon: float = Query(..., description="Origin longitude"),
    to_lat: float = Query(..., description="Destination latitude"),
    to_lon: float = Query(..., description="Destination longitude"),
) -> RouteRequest:
    
    """Calculate a route between two points using GraphHopper.

    Proxies the request to GraphHopper POST /route and returns
    a RouteRequest DTO with the origin, destination, distance and time.

    Args:
        from_lat: Latitude of origin.
        from_lon: Longitude of origin.
        to_lat: Latitude of destination.
        to_lon: Longitude of destination.
        

    Returns:
        RouteRequest object containing origin, destination, distance (m), time (ms),
        and list of route points as [lon, lat] pairs.

    Raises:
        HTTPException: If coordinates are invalid, GraphHopper returns an error,
                       or the response cannot be parsed.

    """
    payload = {
        "profile": "car",
        "points": [
            [from_lon, from_lat],   # GraphHopper uses [lon, lat] 
            [to_lon, to_lat],
        ],
        "points_encoded": False,
        "instructions": False,
        "calc_points": True,
    }

    logger.info("Requesting route from GH: (%s,%s) -> (%s,%s)", from_lat, from_lon, to_lat, to_lon)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ROUTING_URL}/route",
            params={"key": ROUTING_KEY},
            json=payload,
        )

    if response.status_code != 200:
        logger.error("GraphHopper error %s: %s", response.status_code, response.text)
        raise HTTPException(
            status_code=response.status_code,
            detail=f"GraphHopper error: {response.text}",
        )

    data = response.json()
    best_path = data["paths"][0]
    route_points = best_path.get("points", {}).get("coordinates", [])


    return RouteRequest(
        from_location=Location(latitude=from_lat, longitude=from_lon),
        to_location=Location(latitude=to_lat, longitude=to_lon),
        distance_m=best_path["distance"],
        time_ms=best_path["time"],
        points=route_points,
    )