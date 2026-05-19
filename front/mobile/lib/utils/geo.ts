import type { GeoLocation } from "@/lib/models";

/**
 * Great-circle distance between two coordinates in meters.
 * Uses the Haversine formula (mean Earth radius = 6 371 000 m).
 */
export function haversineMeters(a: GeoLocation, b: GeoLocation): number {
  const R = 6371000;
  const phi1 = (a.latitude * Math.PI) / 180;
  const phi2 = (b.latitude * Math.PI) / 180;
  const dPhi = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLambda = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Format a meter distance as "Nm" / "N.N km" depending on magnitude. */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}
