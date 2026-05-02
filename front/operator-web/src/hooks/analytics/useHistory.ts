import { useEffect, useState } from "react";
import { BASE_URL } from "@/lib/api/config";
import type { PillVariant } from "../../components/shared/Pill";
import type { Period } from "./useAnalytics";

export interface PillData { label: string; variant: PillVariant }

export interface HistoryRow {
  id:          string;
  date:        string;
  operator:    string;
  opTriage:    PillData;
  assigned:    string;
  accepted:    string;
  tArrival:    string;
  siteTriage:  PillData;
  hospital:    string;
  tHospital:   string;
  delivery:    PillData;
  tTotal:      string;
}

// ---------------------------------------------------------------------------
// Mock data — shown when backend is unavailable or user is not ANALYST.
// ---------------------------------------------------------------------------

const PRIORITY: PillData[] = [
  { label: "Crítico", variant: "critical" },
  { label: "Urgente", variant: "urgent"   },
  { label: "Leve",    variant: "light"    },
];
const SITE_TRIAGE: PillData[] = [
  { label: "Crítico",   variant: "critical"  },
  { label: "Estable",   variant: "stable"    },
  { label: "Cancelado", variant: "cancelled" },
  { label: "En sitio",  variant: "onsite"    },
];
const DELIVERY: PillData[] = [
  { label: "Entregado", variant: "delivered" },
  { label: "Cancelado", variant: "cancelled" },
];

const OPERATORS  = ["Juan Martínez", "Laura Gómez", "Carlos Restrepo", "Ana Pérez", "Pedro López"];
const PARAMEDICS = ["M. Henao", "D. Sánchez", "J. Rojas", "S. Cárdenas", "R. Vélez", "F. Ortiz", "L. Quintero"];
const HOSPITALS  = ["H. San Vicente", "Clínica Las Vegas", "H. Pablo Tobón", "Clínica El Rosario", "H. General", "Clínica Medellín"];

function rng(seed: number) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

const MOCK_HISTORY: HistoryRow[] = (() => {
  const r = rng(7);
  return Array.from({ length: 24 }).map((_, i) => {
    const id      = `EM-${String(2890 - i).padStart(4, "0")}`;
    const opTri   = PRIORITY[Math.floor(r() * 3)];
    const siteTri = SITE_TRIAGE[Math.floor(r() * SITE_TRIAGE.length)];
    const cancelled = siteTri.label === "Cancelado";
    const delivery = cancelled ? DELIVERY[1] : DELIVERY[Math.floor(r() * 2)];
    const tArr   = `${4 + Math.floor(r() * 8)}m ${Math.floor(r() * 60)}s`;
    const tHosp  = cancelled ? "—" : `${10 + Math.floor(r() * 30)}m`;
    const tTotal = cancelled ? `${5 + Math.floor(r() * 8)}m` : `${18 + Math.floor(r() * 25)}m`;
    const dateD  = String(28 - Math.floor(i / 3)).padStart(2, "0");
    const dateH  = (8 + Math.floor(r() * 12)).toString().padStart(2, "0");
    const dateM  = Math.floor(r() * 60).toString().padStart(2, "0");
    return {
      id,
      date:       `${dateD}/05 ${dateH}:${dateM}`,
      operator:   OPERATORS[Math.floor(r() * OPERATORS.length)],
      opTriage:   opTri,
      assigned:   PARAMEDICS[Math.floor(r() * PARAMEDICS.length)],
      accepted:   PARAMEDICS[Math.floor(r() * PARAMEDICS.length)],
      tArrival:   tArr,
      siteTriage: siteTri,
      hospital:   cancelled ? "—" : HOSPITALS[Math.floor(r() * HOSPITALS.length)],
      tHospital:  tHosp,
      delivery,
      tTotal,
    };
  });
})();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function periodToRange(period: Period): { since: string; to: string } {
  const to = new Date();
  const since = new Date(to);
  switch (period) {
    case "today": since.setHours(0, 0, 0, 0); break;
    case "week":  since.setDate(since.getDate() - 7); break;
    case "month": since.setMonth(since.getMonth() - 1); break;
    case "year":  since.setFullYear(since.getFullYear() - 1); break;
  }
  return { since: since.toISOString(), to: to.toISOString() };
}

function fmtDiffSeconds(a?: string, b?: string): string {
  if (!a || !b) return "—";
  const diffMs = new Date(b).getTime() - new Date(a).getTime();
  if (diffMs <= 0) return "—";
  const s = Math.round(diffMs / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const h   = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${mon} ${h}:${min}`;
}

interface BackendTriage {
  bleeding?: boolean;
  unconscious?: boolean;
  difficulty_breathing?: boolean;
  chest_pain?: boolean;
  [key: string]: boolean | undefined;
}

function triageToPriority(triage: BackendTriage | null): PillData {
  if (!triage) return { label: "Leve", variant: "light" };
  if (triage.unconscious || triage.difficulty_breathing || triage.chest_pain) {
    return { label: "Crítico", variant: "critical" };
  }
  if (triage.bleeding) return { label: "Urgente", variant: "urgent" };
  return { label: "Leve", variant: "light" };
}

function finalStatusToSiteTriage(status: string): PillData {
  switch (status) {
    case "CANCELED": return { label: "Cancelado", variant: "cancelled" };
    case "CLOSED":
    case "IN_TRANSFER": return { label: "Estable",   variant: "stable" };
    case "ON_SITE":     return { label: "En sitio",  variant: "onsite" };
    default:            return { label: "Crítico",   variant: "critical" };
  }
}

interface BackendEmergency {
  id: string;
  filingNumber?: number;
  triage?: BackendTriage | null;
  finalStatus?: string;
  assignedTo?: { name?: string } | null;
  transferedTo?: { name?: string } | null;
  cancelReason?: string | null;
  timeline?: Record<string, string>;
}

function mapBackendEmergency(e: BackendEmergency): HistoryRow {
  const tl = e.timeline ?? {};
  const canceled = e.finalStatus === "CANCELED";
  const delivery: PillData = canceled
    ? { label: "Cancelado", variant: "cancelled" }
    : { label: "Entregado", variant: "delivered" };

  return {
    id:         `EM-${String(e.filingNumber ?? 0).padStart(4, "0")}`,
    date:       fmtDate(tl["RECEIVED"]),
    operator:   "Operador",
    opTriage:   triageToPriority(e.triage ?? null),
    assigned:   e.assignedTo?.name ?? "—",
    accepted:   e.assignedTo?.name ?? "—",
    tArrival:   fmtDiffSeconds(tl["ASSIGNED"], tl["ON_SITE"]),
    siteTriage: finalStatusToSiteTriage(e.finalStatus ?? ""),
    hospital:   e.transferedTo?.name ?? "—",
    tHospital:  fmtDiffSeconds(tl["IN_TRANSFER"], tl["SOLVED"]),
    delivery,
    tTotal:     fmtDiffSeconds(tl["RECEIVED"], tl["CLOSED"] ?? tl["SOLVED"] ?? tl["CANCELED"]),
  };
}

async function fetchHistory(
  token: string,
  since: string,
  to: string,
): Promise<HistoryRow[]> {
  const url = `${BASE_URL}/api/v1/historic/emergency?since=${encodeURIComponent(since)}&to=${encodeURIComponent(to)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`history fetch failed: ${res.status}`);

  const text = await res.text();
  const rows: HistoryRow[] = [];

  // Handle both NDJSON (one object per line) and JSON array.
  if (text.trimStart().startsWith("[")) {
    const arr = JSON.parse(text) as BackendEmergency[];
    return arr.map(mapBackendEmergency);
  }

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      rows.push(mapBackendEmergency(JSON.parse(trimmed) as BackendEmergency));
    } catch {
      // skip malformed lines
    }
  }
  return rows;
}

export function useHistory(period: Period, token?: string): HistoryRow[] {
  const [rows, setRows] = useState<HistoryRow[]>(MOCK_HISTORY);

  useEffect(() => {
    if (!token) return;
    const { since, to } = periodToRange(period);
    let cancelled = false;
    fetchHistory(token, since, to)
      .then((r) => {
        if (!cancelled) setRows(r.length > 0 ? r : MOCK_HISTORY);
      })
      .catch(() => {
        if (!cancelled) setRows(MOCK_HISTORY);
      });
    return () => { cancelled = true; };
  }, [period, token]);

  return rows;
}
