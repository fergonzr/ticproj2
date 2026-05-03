import { useMemo } from "react";
import type { PillVariant } from "../../components/shared/Pill";

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

/**
 * Returns historical emergencies for the analyst dashboard.
 *
 * TODO: replace with real API call once backend is ready:
 *   GET /api/v1/analytics/history?period={period}&page={n}&search={q}
 *
 * IMPORTANT (HU-O001 + non-functional-requirements):
 *   citizen-identifiable data (cédula, name, phone) is NEVER returned.
 *   Operator + paramedic names ARE shown.
 */
export function useHistory(_period: string): HistoryRow[] {
  return useMemo(() => MOCK_HISTORY, []);
}
