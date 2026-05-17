import { useEffect, useState } from "react";
import { reverseGeocodeAddress, type ReverseAddress } from "../../map/geocoding";

export interface TopLocation {
  rank:   number;
  label:  string;
  count:  number;
  weight: number;
}

export interface TopLocationsState {
  loading: boolean;
  rows:    TopLocation[];
}

const STORAGE_KEY    = "siee:heatmap-geocode:v1";
const REQUEST_GAP_MS = 1100;

const memCache: Map<string, ReverseAddress> = loadCacheFromStorage();

function loadCacheFromStorage(): Map<string, ReverseAddress> {
  const map = new Map<string, ReverseAddress>();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return map;
    const obj = JSON.parse(raw) as Record<string, ReverseAddress>;
    for (const [k, v] of Object.entries(obj)) map.set(k, v);
  } catch {
    // Ignore corrupted storage — start fresh.
  }
  return map;
}

function flushCacheToStorage(): void {
  try {
    const obj: Record<string, ReverseAddress> = {};
    memCache.forEach((v, k) => { obj[k] = v; });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Storage full or disabled — silently ignore; in-memory cache still works.
  }
}

function pointKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function bucketLabel(addr: ReverseAddress): string {
  return addr.road ?? addr.suburb ?? "Sin nombre";
}

interface Bucket { count: number; weight: number }

function aggregate(
  points: [number, number, number][],
  resolved: Map<string, ReverseAddress>,
): TopLocation[] {
  const buckets = new Map<string, Bucket>();
  for (const [lat, lng, intensity] of points) {
    const addr = resolved.get(pointKey(lat, lng));
    if (!addr) continue;
    const label = bucketLabel(addr);
    const b = buckets.get(label) ?? { count: 0, weight: 0 };
    b.count  += 1;
    b.weight += intensity;
    buckets.set(label, b);
  }
  const sorted = [...buckets.entries()].sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count;
    return b[1].weight - a[1].weight;
  });
  return sorted.slice(0, 5).map(([label, b], i) => ({
    rank:   i + 1,
    label,
    count:  b.count,
    weight: b.weight,
  }));
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function useTopLocations(
  points: [number, number, number][],
): TopLocationsState {
  const [state, setState] = useState<TopLocationsState>({ loading: true, rows: [] });

  useEffect(() => {
    let cancelled = false;
    const resolved = new Map<string, ReverseAddress>();

    for (const [lat, lng] of points) {
      const key = pointKey(lat, lng);
      const hit = memCache.get(key);
      if (hit) resolved.set(key, hit);
    }

    const pending = points.filter(([lat, lng]) => !resolved.has(pointKey(lat, lng)));

    setState({ loading: pending.length > 0, rows: aggregate(points, resolved) });
    if (pending.length === 0) return;

    (async () => {
      let dirty = false;
      for (let i = 0; i < pending.length; i++) {
        if (cancelled) return;
        const [lat, lng] = pending[i];
        const key = pointKey(lat, lng);

        const addr = await reverseGeocodeAddress(lat, lng);
        if (cancelled) return;

        if (addr) {
          memCache.set(key, addr);
          resolved.set(key, addr);
          dirty = true;
          setState({
            loading: i < pending.length - 1,
            rows:    aggregate(points, resolved),
          });
        } else if (i === pending.length - 1) {
          setState((s) => ({ ...s, loading: false }));
        }

        if (i < pending.length - 1) await delay(REQUEST_GAP_MS);
      }
      if (dirty) flushCacheToStorage();
    })();

    return () => { cancelled = true; };
  }, [points]);

  return state;
}
