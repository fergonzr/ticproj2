import { BASE_URL } from "@/lib/api/config";

export interface BackendLocation {
  latitude:  number;
  longitude: number;
}

export interface BackendTriage {
  bleeding?:             boolean;
  dizziness?:            boolean;
  blurred_vision?:       boolean;
  unconscious?:          boolean;
  difficulty_breathing?: boolean;
  fracture?:             boolean;
  chest_pain?:           boolean;
  numbness_limbs?:       boolean;
  [key: string]: boolean | undefined;
}

export interface BackendUser {
  id?:    string;
  name?:  string;
  email?: string;
}

export interface BackendMedicalCenter {
  id?:   string;
  name?: string;
}

export interface BackendEmergency {
  id:            string;
  location?:     BackendLocation | null;
  filingNumber?: number;
  triage?:       BackendTriage | null;
  finalStatus?:  string;
  operatedBy?:   BackendUser | null;
  assignedTo?:   BackendUser | null;
  transferedTo?: BackendMedicalCenter | null;
  cancelReason?: string | null;
  timeline?:     Record<string, string>;
}

/** Parse the /historic/emergency response, which may arrive as a JSON
 *  array or as NDJSON (one JSON object per line). */
export function parseEmergencyStream(text: string): BackendEmergency[] {
  if (text.trimStart().startsWith("[")) {
    try {
      return JSON.parse(text) as BackendEmergency[];
    } catch {
      // Fall through to line-by-line parsing.
    }
  }

  const out: BackendEmergency[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as BackendEmergency);
    } catch {
      // Skip malformed lines silently.
    }
  }
  return out;
}

export async function fetchEmergencies(
  token: string,
  since: string,
  to: string,
): Promise<BackendEmergency[]> {
  const url = `${BASE_URL}/api/v1/historic/emergency?since=${encodeURIComponent(since)}&to=${encodeURIComponent(to)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`emergency stream fetch failed: ${res.status}`);
  return parseEmergencyStream(await res.text());
}
