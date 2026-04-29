import NavIcon from "../operator/NavIcon";
import type { Period } from "../../hooks/analytics/useAnalytics";
import { styles } from "../../styles/analytics/AnalyticsTopBar.styles";

interface Props {
  period: Period;
  onPeriodChange: (p: Period) => void;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy"          },
  { value: "week",  label: "Esta semana"  },
  { value: "month", label: "Este mes"     },
  { value: "year",  label: "Este año"     },
];

export default function AnalyticsTopBar({ period, onPeriodChange }: Props) {
  return (
    <div style={styles.root}>
      <div style={styles.left}>
        <span style={styles.title}>Analítica</span>
        <span style={styles.subtitle}>Dashboard de desempeño y patrones de emergencias</span>
      </div>

      <div style={styles.right}>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as Period)}
          style={styles.periodSelect}
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button type="button" style={styles.btnPrimary}>
          <NavIcon type="history" size={13} />
          Exportar PDF
        </button>

        <button type="button" style={styles.btnOutline}>
          <NavIcon type="history" size={13} />
          CSV
        </button>
      </div>
    </div>
  );
}
