import { useState } from "react";
import type { TrendData, TrendView } from "../../hooks/analytics/useAnalytics";

interface Props {
  trends: TrendData;
}

const TABS: { key: TrendView; label: string }[] = [
  { key: "hourly",  label: "Horas" },
  { key: "daily",   label: "Días"  },
  { key: "monthly", label: "Meses" },
];

const PRIMARY = "#257985";

const HOURLY_LABELS  = Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? `${i}h` : ""));
const DAILY_LABELS   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHLY_LABELS = ["E","F","M","A","M","J","J","A","S","O","N","D"];

function BarChart({ data, labels, height = 130 }: { data: number[]; labels: string[]; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <svg
        viewBox={`0 0 ${data.length * 20} ${height}`}
        style={{ width: "100%", height, display: "block" }}
        preserveAspectRatio="none"
      >
        {data.map((v, i) => {
          const bh = (v / max) * (height - 18);
          return (
            <rect
              key={i}
              x={i * 20 + 3}
              y={height - bh - 2}
              width={14}
              height={bh}
              rx={3}
              fill={PRIMARY}
              opacity={0.7}
            />
          );
        })}
      </svg>
      <div style={{ display: "flex" }}>
        {labels.map((l, i) => (
          <span key={i} style={{ flex: 1, fontSize: 9, color: "#9ca3af", textAlign: "center" }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export default function TrendChart({ trends }: Props) {
  const [view, setView] = useState<TrendView>("hourly");

  const chartData   = view === "daily" ? trends.daily : view === "monthly" ? trends.monthly : trends.hourly;
  const chartLabels = view === "daily" ? DAILY_LABELS : view === "monthly" ? MONTHLY_LABELS : HOURLY_LABELS;
  const peak        = Math.max(...chartData);
  const avg         = Math.round(chartData.reduce((a, b) => a + b, 0) / chartData.length);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-[10px]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            className={`text-[11px] px-[10px] py-1 rounded-[5px] border cursor-pointer font-semibold ${
              view === t.key
                ? "border-op-primary bg-op-primary-light text-op-primary"
                : "border-op-border bg-op-surface text-op-text-sec"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="min-h-[130px]">
        <BarChart data={chartData} labels={chartLabels} height={130} />
      </div>

      {/* Footer */}
      <div className="mt-2 flex gap-4">
        <div className="flex items-center gap-[5px]">
          <span className="text-[10px] text-op-text-ter">Pico:</span>
          <span className="text-[11px] font-bold text-op-text">{peak}</span>
        </div>
        <div className="flex items-center gap-[5px]">
          <span className="text-[10px] text-op-text-ter">Promedio:</span>
          <span className="text-[11px] font-bold text-op-text">{avg}</span>
        </div>
      </div>
    </div>
  );
}
