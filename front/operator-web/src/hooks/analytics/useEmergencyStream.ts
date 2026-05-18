import { useEffect, useState } from "react";
import { fetchEmergencies, type BackendEmergency } from "./emergencyStream";

export interface EmergencyStreamState {
  loading:     boolean;
  emergencies: BackendEmergency[];
  error:       string | null;
}

/** Fetches the historic emergency stream for a date range.
 *  `since` and `to` MUST be stable across renders (memoize them in the
 *  caller) — they are effect dependencies. */
export function useEmergencyStream(
  since: string,
  to: string,
  token?: string,
): EmergencyStreamState {
  const [state, setState] = useState<EmergencyStreamState>({
    loading:     !!token,
    emergencies: [],
    error:       null,
  });

  useEffect(() => {
    if (!token) {
      setState({ loading: false, emergencies: [], error: null });
      return;
    }
    let cancelled = false;
    setState({ loading: true, emergencies: [], error: null });
    fetchEmergencies(token, since, to)
      .then((emergencies) => {
        if (!cancelled) setState({ loading: false, emergencies, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "fetch failed";
        setState({ loading: false, emergencies: [], error: message });
      });
    return () => { cancelled = true; };
  }, [since, to, token]);

  return state;
}
