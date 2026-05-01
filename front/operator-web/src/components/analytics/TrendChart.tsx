import { useState } from "react";
import { operatorStatusColors as S } from "@/lib/themes/Colors";
import type { TrendData, TrendView } from "../../hooks/analytics/useAnalytics";

interface Props {
  trends: TrendData;
}

const TABS: { key: TrendView; label: string }[] = [
  { key: "hourly",  label: "Horas" },
  { key: "daily",   label: "Días"  },
  { key: "monthly", label: "Meses" },
  { key: "kpis",    label: "KPIs"  },
];

const PRIMARY = "#257985";

const HOURLY_LABELS  = Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? `${i}h` : ""));
const DAILY_LABELS   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHLY_LABELS = ["E","F","M","A","M","J","J","A","S","O","N","D"];

const KPI_SERIES = [
  { key: "triaje"     as const, label: "Triaje",     color: S.triaged.accent  },
  { key: "asignacion" as const, label: "Asignación", color: S.assigned.accent },
  { key: "llegada"    as const, label: "Llegada",    color: S.onSite.accent   },
  { key: "total"      as const, label: "Total",      color: PRIMARY           },
];

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

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 200, h = 26;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
        {view === "kpis" ? (
          <div>
            {KPI_SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-op-text-sec w-[65px] text-right shrink-0">{s.label}</span>
                <Sparkline data={trends.kpis[s.key]} color={s.color} />
              </div>
            ))}
          </div>
        ) : (
          <BarChart data={chartData} labels={chartLabels} height={130} />
        )}
      </div>

      {/* Footer — only shown for bar views */}
      {view !== "kpis" && (
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
      )}
    </div>
  );
}
