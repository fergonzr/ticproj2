import type { HistoryRow } from "../../hooks/analytics/useHistory";
import Pill from "../shared/Pill";
import NavIcon from "../operator/NavIcon";

interface Props { rows: HistoryRow[] }

const COLUMNS = [
  { key: "id",         label: "Radicado",        w: 120 },
  { key: "date",       label: "Fecha / Hora",    w: 120 },
  { key: "operator",   label: "Operador",        w: 150 },
  { key: "opTriage",   label: "Triaje operador", w: 130 },
  { key: "assigned",   label: "Asignado",        w: 140 },
  { key: "accepted",   label: "Aceptado",        w: 140 },
  { key: "tArrival",   label: "T. llegada",      w: 100 },
  { key: "siteTriage", label: "Triaje sitio",    w: 120 },
  { key: "hospital",   label: "Hospital",        w: 180 },
  { key: "tHospital",  label: "T. hospital",     w: 110 },
  { key: "delivery",   label: "Entrega",         w: 120 },
  { key: "tTotal",     label: "T. total",        w: 100 },
] as const;

const TOTAL_W = COLUMNS.reduce((a, c) => a + c.w, 0);
const GRID    = COLUMNS.map((c) => `${c.w}px`).join(" ");

export default function HistoryTable({ rows }: Props) {
  return (
    <div className="bg-op-surface rounded-[10px] border border-op-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-op-border">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-op-text">Historial de emergencias</span>
          <span className="text-[11px] text-op-text-ter">· {rows.length} registros</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-op-text-ter">
              <NavIcon type="history" size={13} />
            </span>
            <input
              type="text"
              placeholder="Buscar radicado, operador..."
              className="text-[12px] pl-7 pr-3 py-[6px] rounded-[6px] border border-op-border bg-op-surface text-op-text w-[220px] focus:outline-none focus:border-op-primary"
            />
          </div>
          <button type="button" className="text-[12px] px-3 py-[6px] rounded-[6px] border border-op-border bg-op-surface text-op-text-sec font-semibold flex items-center gap-[6px] hover:bg-op-bg">
            Filtros
          </button>
        </div>
      </div>

      {/* Table — horizontal scroll */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: TOTAL_W }}>
          <div
            className="grid items-center px-4 py-[10px] border-b border-op-border bg-op-bg gap-3"
            style={{ gridTemplateColumns: GRID }}
          >
            {COLUMNS.map((c) => (
              <span key={c.key} className="text-[10px] font-bold text-op-text-ter uppercase tracking-[0.5px] truncate">
                {c.label}
              </span>
            ))}
          </div>

          {rows.map((row, i) => (
            <div
              key={row.id}
              className={`grid items-center px-4 py-[11px] gap-3 hover:bg-op-primary-light/40 cursor-pointer transition-colors ${
                i < rows.length - 1 ? "border-b border-op-border-light" : ""
              }`}
              style={{ gridTemplateColumns: GRID }}
            >
              <span className="text-[12px] font-bold text-op-primary truncate min-w-0">{row.id}</span>
              <span className="text-[12px] text-op-text-sec truncate min-w-0">{row.date}</span>
              <span className="text-[12px] text-op-text font-semibold truncate min-w-0">{row.operator}</span>
              <span className="min-w-0"><Pill variant={row.opTriage.variant}>{row.opTriage.label}</Pill></span>
              <span className="text-[12px] text-op-text-sec truncate min-w-0">{row.assigned}</span>
              <span className="text-[12px] text-op-text-sec truncate min-w-0">{row.accepted}</span>
              <span className="text-[12px] text-op-text font-mono truncate min-w-0">{row.tArrival}</span>
              <span className="min-w-0"><Pill variant={row.siteTriage.variant}>{row.siteTriage.label}</Pill></span>
              <span className="text-[12px] text-op-text truncate min-w-0">{row.hospital}</span>
              <span className="text-[12px] text-op-text font-mono truncate min-w-0">{row.tHospital}</span>
              <span className="min-w-0"><Pill variant={row.delivery.variant}>{row.delivery.label}</Pill></span>
              <span className="text-[12px] text-op-text font-mono font-bold truncate min-w-0">{row.tTotal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-op-border">
        <span className="text-[11px] text-op-text-ter">Mostrando 1–{rows.length} de 147 registros</span>
        <div className="flex items-center gap-1">
          <button type="button" className="w-7 h-7 rounded-[6px] border border-op-border bg-op-surface text-op-text-sec hover:bg-op-bg disabled:opacity-40" disabled>‹</button>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              className={`min-w-[28px] h-7 px-2 rounded-[6px] text-[12px] font-semibold ${
                n === 1 ? "bg-op-primary text-white" : "border border-op-border bg-op-surface text-op-text-sec hover:bg-op-bg"
              }`}
            >
              {n}
            </button>
          ))}
          <button type="button" className="w-7 h-7 rounded-[6px] border border-op-border bg-op-surface text-op-text-sec hover:bg-op-bg">›</button>
        </div>
      </div>
    </div>
  );
}
