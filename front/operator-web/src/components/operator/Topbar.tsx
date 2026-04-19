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
}

const CHIPS: { key: keyof ParamedicCounts; label: string; dot: string }[] = [
  { key: "available", label: "disponibles", dot: "#22c55e" },
  { key: "onRoute",   label: "en ruta",     dot: "#eab308" },
];

export default function Topbar({ operatorName, paramedicCounts }: Props) {
  return (
    <div style={styles.container}>
      <span style={styles.title}>{str.operatorDashboardTitle}</span>
      <div style={styles.right}>
        <div style={styles.statusRow}>
          {CHIPS.map(({ key, label, dot }) => (
            <div key={key} style={styles.statusChip}>
              <span style={{ ...styles.statusDot, background: dot }} />
              <span style={styles.statusText}>
                {paramedicCounts[key]} {label}
              </span>
            </div>
          ))}
        </div>
        <div style={styles.divider} />
        <span style={styles.operatorName}>{operatorName}</span>
      </div>
    </div>
  );
}
