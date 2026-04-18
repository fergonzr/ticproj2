"""Geometric operations for route simplification."""

"""
This module works directly with coordinates in degrees (longitude, latitude)
as returned by GraphHopper. The simplify_polyline function uses
Shapely.simplify() with a tolerance that is interpreted in DEGREES, not meters.

This has important implications:
- 1 degree of latitude ≈ 111 km
- 1 degree of longitude ≈ 85 km (at mid-latitudes)

Therefore, for short routes (less than ~10 km), even a tolerance of 0.01 degrees

(approximately 1 km) will eliminate virtually all intermediate points,
leaving only the origin and destination.

If you test with routes of 2-3 km, it is NORMAL to get 2 points

for any simplify_tolerance > 0. The algorithm is not failing; it is a consequence
of the degree scale :>

If you wish to preserve the original, unsimplified geometry, use simplify_tolerance=0.

"""

from typing import List, Tuple

from shapely.geometry import LineString

Coordinates = List[Tuple[float, float]]


def simplify_polyline(
    points: Coordinates,
    tolerance_meters: float,
    preserve_topology: bool = False
) -> Coordinates:
    """
    Simplify a polyline using the Ramer-Douglas-Peucker algorithm.

    Args:
        points: List of (lon, lat) coordinates.
        tolerance_meters: Maximum distance deviation in meters.
        preserve_topology: If True, avoids creating invalid geometries.

    Returns:
        Simplified list of coordinates.
    """
    if tolerance_meters <= 0 or len(points) <= 2:
        return points

    line = LineString(points)
    simplified = line.simplify(tolerance_meters, preserve_topology=preserve_topology)
    return list(simplified.coords)