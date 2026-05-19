import NavIcon from "../operator/NavIcon";
import type { Period } from "../../hooks/analytics/useAnalytics";

export type AnalyticsView = "analytics" | "history" | "heatmap";

interface Props {
  view:           AnalyticsView;
  onViewChange:   (v: AnalyticsView) => void;
  analyticsPeriod:         Period;
  onAnalyticsPeriodChange: (p: Period) => void;
  historyPeriod:           Period;
  onHistoryPeriodChange:   (p: Period) => void;
}

const TABS: { id: AnalyticsView; label: string }[] = [
  { id: "analytics", label: "Analítica" },
  { id: "history",   label: "Historial" },
  { id: "heatmap",   label: "Mapa de calor" },
];

const SUBTITLE: Record<AnalyticsView, string> = {
  analytics: "Dashboard de desempeño y patrones de emergencias",
  history:   "Historial completo de emergencias",
  heatmap:   "Zonas con más emergencias — Envigado",
};

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy"         },
  { value: "week",  label: "Esta semana" },
  { value: "month", label: "Este mes"    },
  { value: "year",  label: "Este año"    },
];

interface PeriodSelectProps {
  value:    Period;
  onChange: (p: Period) => void;
}

function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
      className="text-[12px] px-[10px] py-[6px] rounded-[6px] border border-op-border bg-op-surface text-op-text cursor-pointer font-medium"
    >
      {PERIOD_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function AnalyticsTopBar({
  view,
  onViewChange,
  analyticsPeriod,
  onAnalyticsPeriodChange,
  historyPeriod,
  onHistoryPeriodChange,
}: Props) {
  return (
    <div className="h-[52px] bg-op-surface border-b border-op-border flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex bg-op-bg rounded-[9px] p-[3px]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onViewChange(t.id)}
              className={`text-[12px] px-3 py-[6px] rounded-[7px] font-semibold transition-colors ${
                view === t.id
                  ? "bg-op-surface text-op-text shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-op-text-sec hover:text-op-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-op-text-ter">{SUBTITLE[view]}</span>
      </div>

      <div className="flex items-center gap-[10px]">
        {view === "analytics" && (
          <PeriodSelect value={analyticsPeriod} onChange={onAnalyticsPeriodChange} />
        )}

        {view === "history" && (
          <>
            <PeriodSelect value={historyPeriod} onChange={onHistoryPeriodChange} />
            <button type="button" className="text-[12px] px-3 py-[6px] rounded-[6px] border-0 bg-op-primary text-white font-semibold cursor-pointer flex items-center gap-[6px]">
              <NavIcon type="history" size={13} />
              PDF
            </button>
            <button type="button" className="text-[12px] px-3 py-[6px] rounded-[6px] border border-op-border bg-op-surface text-op-text-sec font-semibold cursor-pointer flex items-center gap-[6px]">
              <NavIcon type="history" size={13} />
              CSV
            </button>
          </>
        )}

        {view === "heatmap" && (
          <span className="text-[12px] text-op-text-ter px-[10px] py-[6px] font-medium">
            Todos los registros
          </span>
        )}
      </div>
    </div>
  );
}
