import type { TrendData } from "../../hooks/analytics/useAnalytics";

interface Props {
  trend: TrendData;
}

const PRIMARY = "#257985";

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

export default function TrendChart({ trend }: Props) {
  const peak = Math.max(...trend.data);
  const avg  = Math.round(trend.data.reduce((a, b) => a + b, 0) / trend.data.length);

  return (
    <div>
      {/* Chart area */}
      <div className="min-h-[130px]">
        <BarChart data={trend.data} labels={trend.labels} height={130} />
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
