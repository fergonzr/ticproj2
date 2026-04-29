import NavIcon from "../operator/NavIcon";
import type { KpiData } from "../../hooks/analytics/useAnalytics";
import { styles } from "../../styles/analytics/KpiCard.styles";

interface Props {
  kpi: KpiData;
}

export default function KpiCard({ kpi }: Props) {
  const improved = kpi.delta < 0;
  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={{ ...styles.iconBox, color: kpi.color }}>
          <NavIcon type={kpi.icon} size={15} />
        </div>
        <span style={styles.label}>{kpi.label}</span>
      </div>

      <div style={styles.value}>{kpi.value}</div>

      <div style={styles.footer}>
        <span style={improved ? styles.deltaGood : styles.deltaBad}>
          {improved ? "↓" : "↑"} {Math.abs(kpi.delta)}%
        </span>
        <span style={styles.avg}>vs prom. {kpi.avg}</span>
      </div>
    </div>
  );
}
