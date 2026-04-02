import { View, Text, TouchableOpacity } from "react-native";
import { SafeEmergency } from "@/lib/models";
import { styles } from "@/lib/styles/operator/EmergencyCard.styles";
import { emergencyColors, triageColors, colors } from "@/lib/themes/Colors";

interface Props {
  emergency: SafeEmergency;
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
  const { alert, status, triage } = emergency;
  const patientName = alert.medicalInfo
    ? `${alert.medicalInfo.firstName} ${alert.medicalInfo.lastName}`
    : "Paciente desconocido";

  const scheme = statusScheme(status);
  const accent = accentBar(status);
  const hasTriage = triage !== null;
  const triageColor = hasTriage
    ? Object.values(triage!).some((v) => v) ? triageColors.critical : triageColors.mild
    : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: accent },
        isSelected && styles.cardSelected,
      ]}
      onPress={() => onPress(emergency.id)}
      activeOpacity={0.75}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.alertLabel}>Alerta</Text>
          <Text style={styles.time}>{formatTime(alert.reportedOn)}</Text>
        </View>
        <View style={styles.patientRow}>
          {triageColor && (
            <View style={[styles.triageDot, { backgroundColor: triageColor }]} />
          )}
          <Text style={styles.patientName} numberOfLines={1}>{patientName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: scheme.bg, borderColor: scheme.border }]}>
          <Text style={[styles.statusText, { color: scheme.text }]}>
            {STATUS_LABELS[status] ?? status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}