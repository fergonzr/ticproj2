import type { OperatorEmergency } from "@/lib/api/interfaces";
import { colors, emergencyColors } from "@/lib/themes/Colors";
import { styles } from "../../styles/operator/EmergencyCard.styles";

interface Props {
  emergency: OperatorEmergency;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED:    "Recibida",
  TRIAGED:     "Triajada",
  ASSIGNED:    "Asignada",
  ON_SITE:     "En sitio",
  IN_TRANSFER: "En traslado",
  CLOSED:      "Cerrada",
  CANCELED:    "Cancelada",
};

function statusScheme(status: string) {
  switch (status) {
    case "RECEIVED":
    case "TRIAGED":     return emergencyColors.pending;
    case "ASSIGNED":    return emergencyColors.assigned;
    case "ON_SITE":
    case "IN_TRANSFER": return emergencyColors.active;
    case "CLOSED":
    case "CANCELED":    return emergencyColors.done;
    default:            return emergencyColors.pending;
  }
}

function accentBar(status: string): string {
  switch (status) {
    case "RECEIVED":
    case "TRIAGED":     return "#ef9f27";
    case "ASSIGNED":    return "#afa9ec";
    case "ON_SITE":
    case "IN_TRANSFER": return "#185fa5";
    default:            return colors.border;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  } catch { return "--:--"; }
}

export default function EmergencyCard({ emergency, isSelected, onPress }: Props) {
  const scheme = statusScheme(emergency.state);
  const accent = accentBar(emergency.state);
  const patientName = emergency.medicalInfo?.trim() || "Paciente desconocido";

  const cardStyle = {
    ...styles.card,
    borderLeftColor: accent,
    ...(isSelected ? styles.cardSelected : {}),
  };

  return (
    <button style={cardStyle} onClick={() => onPress(emergency.id)} type="button">
      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.alertLabel}>Alerta</span>
          <span style={styles.time}>{formatTime(emergency.reportedOn)}</span>
        </div>
        <div style={styles.patientRow}>
          <span style={styles.patientName}>{patientName}</span>
        </div>
        <span style={{ ...styles.statusBadge, background: scheme.bg, borderColor: scheme.border }}>
          <span style={{ ...styles.statusText, color: scheme.text }}>
            {STATUS_LABELS[emergency.state] ?? emergency.state}
          </span>
        </span>
      </div>
    </button>
  );
}
