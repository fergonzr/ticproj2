import NavIcon from "../operator/NavIcon";
import type { KpiData } from "../../hooks/analytics/useAnalytics";

interface Props {
  kpi: KpiData;
}

export default function KpiCard({ kpi }: Props) {
  const improved = kpi.delta < 0;
  return (
    <div className="bg-op-surface rounded-[10px] p-4 border border-op-border flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-[7px] bg-op-bg flex items-center justify-center shrink-0"
          style={{ color: kpi.color }}
        >
          <NavIcon type={kpi.icon} size={15} />
        </div>
        <span className="text-[12px] text-op-text-sec font-medium">{kpi.label}</span>
      </div>

      <div className="text-[24px] font-bold text-op-text tracking-[-0.5px]">{kpi.value}</div>

      <div className="flex items-center gap-[6px]">
        <span className={`text-[11px] font-bold ${improved ? "text-op-success" : "text-op-error"}`}>
          {improved ? "↓" : "↑"} {Math.abs(kpi.delta)}%
        </span>
        <span className="text-[11px] text-op-text-ter">vs prom. {kpi.avg}</span>
      </div>
    </div>
  );
}
