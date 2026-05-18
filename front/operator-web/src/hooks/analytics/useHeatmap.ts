import { useEffect, useState } from "react";
import { BASE_URL } from "@/lib/api/config";

export interface HeatmapState {
  loading: boolean;
  points:  [number, number, number][];
  error:   string | null;
}

// Wide range that comfortably covers the entire SIEE history.
const SINCE_EPOCH = "2000-01-01T00:00:00Z";

interface BackendLocation {
  latitude:  number;
  longitude: number;
}

interface BackendEmergency {
  location?: BackendLocation | null;
}

function consume(e: BackendEmergency, out: [number, number, number][]): void {
  const loc = e.location;
  if (!loc) return;
  if (typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return;
  out.push([loc.latitude, loc.longitude, 1.0]);
}

function parseStream(text: string): [number, number, number][] {
  const points: [number, number, number][] = [];

  // Handle both JSON array and NDJSON (FastAPI streaming response).
  if (text.trimStart().startsWith("[")) {
    try {
      const arr = JSON.parse(text) as BackendEmergency[];
      for (const e of arr) consume(e, points);
      return points;
    } catch {
      // Fall through to line-by-line parsing if the JSON array parse fails.
    }
  }

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      consume(JSON.parse(trimmed) as BackendEmergency, points);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return points;
}

async function fetchAllPoints(token: string): Promise<[number, number, number][]> {
  const now = new Date().toISOString();
  const url = `${BASE_URL}/api/v1/historic/emergency?since=${encodeURIComponent(SINCE_EPOCH)}&to=${encodeURIComponent(now)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`heatmap fetch failed: ${res.status}`);
  return parseStream(await res.text());
}

export function useHeatmap(token?: string): HeatmapState {
  const [state, setState] = useState<HeatmapState>({
    loading: !!token,
    points:  [],
    error:   null,
  });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, points: [], error: null });
      return;
    }
    let cancelled = false;
    setState({ loading: true, points: [], error: null });
    fetchAllPoints(token)
      .then((points) => {
        if (!cancelled) setState({ loading: false, points, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "fetch failed";
        setState({ loading: false, points: [], error: message });
      });
    return () => { cancelled = true; };
  }, [token]);

  return state;
}
