/**
 * OpenStreetMap Nominatim geocoding helpers, called directly from the browser.
 * No API key. Nominatim asks for <= 1 request/second: forward search is
 * triggered by an explicit button and reverse geocoding runs once per edit,
 * so the limit is respected without extra throttling.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";

export interface GeocodeResult {
  /** Nominatim `display_name` — a human-readable address. */
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * Forward geocoding: an address string -> up to 5 candidate results.
 * Returns `[]` when the query is blank or has no matches. Throws on a
 * network/HTTP failure so the caller can distinguish "error" from "no results".
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed === "") return [];
  const url =
    `${NOMINATIM}/search?q=${encodeURIComponent(trimmed)}` +
    `&format=jsonv2&countrycodes=co&limit=5`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  return data.map((d) => ({
    label: d.display_name,
    latitude: Number(d.lat),
    longitude: Number(d.lon),
  }));
}

/**
 * Reverse geocoding: coordinates -> a human-readable address.
 * Non-critical — returns `null` on any failure so the caller can fall back
 * to showing raw coordinates.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const url =
      `${NOMINATIM}/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return typeof data.display_name === "string" ? data.display_name : null;
  } catch {
    return null;
  }
}
