import { GeoLocation } from "@/lib/models";

export type GeocodeResult = {
  label: string;
  location: GeoLocation;
};

const ENVIGADO_PROXIMITY = { lon: -75.592, lat: 6.168 };

function maptilerKey(): string {
  return process.env.EXPO_PUBLIC_MAPTILER_KEY ?? "";
}

export function isGeocodingAvailable(): boolean {
  return maptilerKey().length > 0;
}

/**
 * Looks up an address via the MapTiler Geocoding API, biased toward Envigado.
 * Returns an empty list when the query is blank or geocoding is unavailable.
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  const key = maptilerKey();
  if (trimmed.length === 0 || key.length === 0) return [];

  const params = new URLSearchParams({
    key,
    country: "co",
    proximity: `${ENVIGADO_PROXIMITY.lon},${ENVIGADO_PROXIMITY.lat}`,
    limit: "5",
  });
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(trimmed)}.json?${params}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);

  const data = (await response.json()) as {
    features?: {
      place_name?: string;
      text?: string;
      geometry?: { coordinates?: [number, number] };
    }[];
  };

  return (data.features ?? [])
    .filter((f) => Array.isArray(f.geometry?.coordinates))
    .map((f) => ({
      label: f.place_name ?? f.text ?? "Ubicación sin nombre",
      location: {
        longitude: (f.geometry!.coordinates as [number, number])[0],
        latitude: (f.geometry!.coordinates as [number, number])[1],
      },
    }));
}
