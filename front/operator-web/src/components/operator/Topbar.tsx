import { styles } from "../../styles/operator/Topbar.styles";
import * as str from "@/lib/strings";

export interface ParamedicCounts {
  available: number;
  onRoute: number;
  outOfService: number;
}

interface Props {
  operatorName: string;
  paramedicCounts: ParamedicCounts;
  onLogout: () => void;
}

const STATUS_CHIPS: { key: keyof ParamedicCounts; label: string; dot: string }[] = [
  { key: "available",    label: "Disponible",        dot: "#3fb950" },
  { key: "onRoute",      label: "En curso",          dot: "#e3b341" },
  { key: "outOfService", label: "Fuera de servicio", dot: "#8b949e" },
];

export default function Topbar({ operatorName, paramedicCounts, onLogout }: Props) {
  return (
    <div style={styles.container}>
      <span style={styles.title}>{str.operatorDashboardTitle}</span>

      <div style={styles.statusRow}>
        {STATUS_CHIPS.map(({ key, label, dot }) => (
          <div key={key} style={styles.statusChip}>
            <span style={{ ...styles.statusDot, background: dot }} />
            <span style={styles.statusChipText}>
              {label}{" "}
              <span style={styles.statusCount}>{paramedicCounts[key]}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={styles.right}>
        <span style={styles.operatorName}>{operatorName}</span>
        <button style={styles.logoutBtn} onClick={onLogout}>
          {str.logout}
        </button>
      </div>
    </div>
  );
}
