import { paramedicStatusColors } from "@/lib/themes/Colors";
import { paramedicStatusLabels } from "@/lib/strings";
import { styles } from "../../styles/operator/ParamedicRow.styles";

export interface ParamedicEntry {
  id: string;
  name: string;
  status: string;
}

interface Props {
  paramedic: ParamedicEntry;
  distanceKm: number | null;
  onAssign: (id: string) => void;
}

export default function ParamedicRow({ paramedic, distanceKm, onAssign }: Props) {
  const initials = paramedic.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const distanceLabel = distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "— km";
  const sc = paramedicStatusColors[paramedic.status] ?? paramedicStatusColors.AVAILABLE;
  const statusLabel = paramedicStatusLabels[paramedic.status] ?? paramedic.status;
  const canAssign = paramedic.status === "AVAILABLE";

  return (
    <div style={styles.row}>
      <div style={styles.avatar}>
        <span style={styles.avatarText}>{initials}</span>
      </div>
      <div style={styles.info}>
        <div style={styles.name}>{paramedic.name}</div>
        <div style={styles.distance}>{distanceLabel}</div>
        <span style={{ ...styles.statusBadge, background: sc.bg, borderColor: sc.border }}>
          <span style={{ ...styles.statusText, color: sc.text }}>{statusLabel}</span>
        </span>
      </div>
      {canAssign && (
        <button style={styles.assignBtn} onClick={() => onAssign(paramedic.id)} type="button">
          Asignar
        </button>
      )}
    </div>
  );
}
