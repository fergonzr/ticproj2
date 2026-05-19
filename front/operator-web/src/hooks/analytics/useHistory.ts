import { useMemo } from "react";
import type { PillVariant } from "../../components/shared/Pill";
import type { Period } from "./useAnalytics";
import { useEmergencyStream } from "./useEmergencyStream";
import type { BackendEmergency, BackendTriage } from "./emergencyStream";

export interface PillData { label: string; variant: PillVariant }

export interface HistoryRow {
  id:         string;
  date:       string;
  operator:   string;
  opTriage:   PillData;
  assigned:   string;
  tArrival:   string;
  siteTriage: PillData;
  hospital:   string;
  tHospital:  string;
  delivery:   PillData;
  tTotal:     string;
}

export interface HistoryState {
  loading: boolean;
  rows:    HistoryRow[];
  error:   string | null;
}

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

/** Epoch ms of the emergency's RECEIVED event (its creation time).
 *  Emergencies without a RECEIVED entry get 0 so they sort last. */
function receivedTime(e: BackendEmergency): number {
  const iso = e.timeline?.["RECEIVED"];
  return iso ? new Date(iso).getTime() : 0;
}

function triageToPriority(triage: BackendTriage | null): PillData {
  if (!triage) return { label: "Leve", variant: "light" };
  if (triage.unconscious || triage.difficulty_breathing || triage.chest_pain) {
    return { label: "Crítico", variant: "critical" };
  }
  if (triage.bleeding) return { label: "Urgente", variant: "urgent" };
  return { label: "Leve", variant: "light" };
}

/** Maps the paramedic's on-site complexity retriage to a pill.
 *  `complexityLevel` is the backend ComplexityLevel enum: 0 BASIC,
 *  1 INTERMEDIATE, 2 HIGH. `null`/undefined means the paramedic never
 *  retriaged the emergency (e.g. it was canceled before their arrival).
 *
 *  Labels share the operator-triage vocabulary (Crítico/Urgente/Leve)
 *  so an analyst can compare both columns at a glance: same severity,
 *  same word — the paramedic's call simply overrides the operator's. */
function complexityToSiteTriage(level?: number | null): PillData {
  switch (level) {
    case 2:  return { label: "Crítico", variant: "critical" };
    case 1:  return { label: "Urgente", variant: "urgent" };
    case 0:  return { label: "Leve",    variant: "light" };
    default: return { label: "—",       variant: "cancelled" };
  }
}

function mapBackendEmergency(e: BackendEmergency): HistoryRow {
  const tl = e.timeline ?? {};
  const canceled = e.finalStatus === "CANCELED";
  const delivery: PillData = canceled
    ? { label: "Cancelado", variant: "cancelled" }
    : { label: "Entregado", variant: "delivered" };

  return {
    id:         e.filingNumber != null ? String(e.filingNumber) : "—",
    date:       fmtDate(tl["RECEIVED"]),
    operator:   e.operatedBy?.name ?? "—",
    opTriage:   triageToPriority(e.triage ?? null),
    assigned:   e.assignedTo?.name ?? "—",
    tArrival:   fmtDiffSeconds(tl["ASSIGNED"], tl["ON_SITE"]),
    siteTriage: complexityToSiteTriage(e.complexityLevel),
    hospital:   e.transferedTo?.name ?? "—",
    tHospital:  fmtDiffSeconds(tl["IN_TRANSFER"], tl["SOLVED"]),
    delivery,
    tTotal:     fmtDiffSeconds(tl["RECEIVED"], tl["CLOSED"] ?? tl["SOLVED"] ?? tl["CANCELED"]),
  };
}

export function useHistory(period: Period, token?: string): HistoryState {
  const { since, to } = useMemo(() => periodToRange(period), [period]);
  const { loading, emergencies, error } = useEmergencyStream(since, to, token);
  const rows = useMemo(() => {
    // Newest first: order by the RECEIVED event (creation time) descending.
    // Sorting happens on the raw data because HistoryRow.date is a
    // year-less "dd/mm hh:mm" string and cannot be ordered reliably.
    const ordered = [...emergencies].sort(
      (a, b) => receivedTime(b) - receivedTime(a),
    );
    return ordered.map(mapBackendEmergency);
  }, [emergencies]);
  return { loading, rows, error };
}
