import { useEffect, useState } from "react";
import { reverseGeocode } from "../../map/geocoding";
import type { GeoLocation } from "@/lib/models";

/** Module-level cache so re-opening the same emergency (or different
 *  components looking at the same coords) only hits Nominatim once.
 *  Stores either the resolved address, a literal `null` for a known
 *  failure, or a pending promise to dedupe concurrent lookups. */
type CacheEntry = string | null | Promise<string | null>;
const cache = new Map<string, CacheEntry>();

/** Rounds to 4 decimals (~11 m) so tiny GPS jitter between updates of the
 *  same emergency reuses the same cache slot. */
function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export interface ReverseGeocodeState {
  /** The resolved address, or `null` until the lookup finishes or fails. */
  address: string | null;
  loading: boolean;
}

/**
 * Reverse-geocodes a `GeoLocation` via Nominatim with shared caching.
 * Returns `{ address: null, loading: false }` when called with a null
 * location so callers don't need to branch before invoking the hook.
 */
export function useReverseGeocode(
  location: GeoLocation | null,
): ReverseGeocodeState {
  const [address, setAddress] = useState<string | null>(() => {
    if (!location) return null;
    const cached = cache.get(cacheKey(location.latitude, location.longitude));
    return typeof cached === "string" ? cached : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      setAddress(null);
      setLoading(false);
      return;
    }

    const key = cacheKey(location.latitude, location.longitude);
    const cached = cache.get(key);

    // Resolved string — show it immediately, no fetch.
    if (typeof cached === "string") {
      setAddress(cached);
      setLoading(false);
      return;
    }
    // Known failure — surface `null` so the caller falls back to coords.
    if (cached === null) {
      setAddress(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    const pending: Promise<string | null> =
      cached ?? reverseGeocode(location.latitude, location.longitude);
    if (!cached) cache.set(key, pending);

    pending
      .then((result) => {
        cache.set(key, result);
        if (cancelled) return;
        setAddress(result);
        setLoading(false);
      })
      .catch(() => {
        cache.set(key, null);
        if (cancelled) return;
        setAddress(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude]);

  return { address, loading };
}
