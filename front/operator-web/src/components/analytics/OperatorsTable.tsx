import { operatorUiColors as U } from "@/lib/themes/Colors";
import type { OperatorData } from "../../hooks/analytics/useAnalytics";
import { styles } from "../../styles/analytics/OperatorsTable.styles";

interface Props {
  operators: OperatorData[];
}

const HEADER_COLS = ["#", "Operador", "Atend.", "T.prom", ""];

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function OperatorsTable({ operators }: Props) {
  const maxAttended = Math.max(...operators.map((o) => o.attended), 1);

  return (
    <div>
      <div style={styles.headerRow}>
        {HEADER_COLS.map((h, i) => (
          <span key={i} style={{ ...styles.headerCell, textTransform: "uppercase" }}>{h}</span>
        ))}
      </div>

      {operators.map((op, i) => (
        <div
          key={i}
          style={{
            ...styles.row,
            borderBottom: i < operators.length - 1 ? `1px solid ${U.borderLight}` : "none",
          }}
        >
          <span style={styles.rank}>{i + 1}</span>

          <div style={styles.nameCell}>
            <div style={styles.avatar}>{initials(op.name)}</div>
            <span style={styles.name}>{op.name}</span>
          </div>

          <div>
            <div style={styles.attendedNum}>{op.attended}</div>
            <div style={styles.miniBarTrack}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  background: U.primary,
                  width: `${(op.attended / maxAttended) * 100}%`,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>

          <span style={styles.avgTime}>{op.avgTime}</span>

          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: op.active ? U.success : U.textTer,
              justifySelf: "center",
            }}
          />
        </div>
      ))}
    </div>
  );
}
