import type { PipelineStage } from "../../hooks/analytics/useAnalytics";
import { styles } from "../../styles/analytics/StackedPipelineBar.styles";

interface Props {
  stages: PipelineStage[];
}

function parseSeconds(time: string): number {
  const m = time.match(/(\d+)\s*m/);
  const s = time.match(/(\d+)\s*s/);
  return (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0);
}

function formatTotal(sec: number): string {
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${sec}s`;
}

export default function StackedPipelineBar({ stages }: Props) {
  const segs = stages.map((s) => ({ ...s, sec: parseSeconds(s.time) }));
  const total = segs.reduce((a, b) => a + b.sec, 0);

  return (
    <div>
      {/* Header */}
      <div style={styles.totalHeader}>
        <span style={{ ...styles.totalLabel, textTransform: "uppercase" }}>Tiempo total</span>
        <span style={styles.totalValue}>{formatTotal(total)}</span>
      </div>

      {/* Stacked bar */}
      <div style={styles.bar}>
        {segs.map((seg, i) => (
          <div
            key={i}
            title={`${seg.stage}: ${seg.time}`}
            style={{
              flex: seg.sec,
              background: seg.color,
              opacity: 0.9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              borderRight: i < segs.length - 1 ? "1px solid rgba(255,255,255,.4)" : "none",
              minWidth: 36,
            }}
          >
            {Math.round((seg.sec / total) * 100)}%
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {segs.map((seg, i) => (
          <div key={i} style={styles.legendItem}>
            <div style={styles.legendHeader}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
              <span style={styles.legendLabel}>{seg.stage}</span>
            </div>
            <span style={styles.legendTime}>{seg.time}</span>
          </div>
        ))}
      </div>

      {/* Std dev footer */}
      <div style={styles.stdDevFooter}>
        <span style={styles.stdDevLabel}>Desviación estándar</span>
        <span style={styles.stdDevValue}>±2m 15s</span>
      </div>
    </div>
  );
}
