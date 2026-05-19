import { useMemo } from "react";
import { useEmergencyStream } from "./useEmergencyStream";

export interface HeatmapState {
  loading: boolean;
  points:  [number, number, number][];
  error:   string | null;
}

// Wide range that comfortably covers the entire SIEE history.
const SINCE_EPOCH = "2000-01-01T00:00:00Z";

export function useHeatmap(token?: string): HeatmapState {
  // Computed once on mount so the stream effect does not re-fire.
  const to = useMemo(() => new Date().toISOString(), []);
  const { loading, emergencies, error } = useEmergencyStream(SINCE_EPOCH, to, token);

  const points = useMemo<[number, number, number][]>(() => {
    const out: [number, number, number][] = [];
    for (const e of emergencies) {
      const loc = e.location;
      if (!loc) continue;
      if (typeof loc.latitude !== "number" || typeof loc.longitude !== "number") continue;
      out.push([loc.latitude, loc.longitude, 1.0]);
    }
    return out;
  }, [emergencies]);

  return { loading, points, error };
}
