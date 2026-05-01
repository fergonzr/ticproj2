import NavIcon from "../operator/NavIcon";
import type { Period } from "../../hooks/analytics/useAnalytics";

interface Props {
  period: Period;
  onPeriodChange: (p: Period) => void;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy"         },
  { value: "week",  label: "Esta semana" },
  { value: "month", label: "Este mes"    },
  { value: "year",  label: "Este año"    },
];

export default function AnalyticsTopBar({ period, onPeriodChange }: Props) {
  return (
    <div className="h-[52px] bg-op-surface border-b border-op-border flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[16px] font-bold text-op-text">Analítica</span>
        <span className="text-[12px] text-op-text-ter">Dashboard de desempeño y patrones de emergencias</span>
      </div>

      <div className="flex items-center gap-[10px]">
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as Period)}
          className="text-[12px] px-[10px] py-[6px] rounded-[6px] border border-op-border bg-op-surface text-op-text cursor-pointer font-medium"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          type="button"
          className="text-[12px] px-3 py-[6px] rounded-[6px] border-0 bg-op-primary text-white font-semibold cursor-pointer flex items-center gap-[6px]"
        >
          <NavIcon type="history" size={13} />
          Exportar PDF
        </button>

        <button
          type="button"
          className="text-[12px] px-3 py-[6px] rounded-[6px] border border-op-border bg-op-surface text-op-text-sec font-semibold cursor-pointer flex items-center gap-[6px]"
        >
          <NavIcon type="history" size={13} />
          CSV
        </button>
      </div>
    </div>
  );
}
