import { View, Text, TouchableOpacity } from "react-native";
import { SafeEmergency } from "@/lib/models";
import { styles } from "@/lib/styles/operator/EmergencyCard.styles";
import { emergencyColors, triageColors } from "@/lib/themes/Colors";

interface Props {
  emergency: SafeEmergency;
  isSelected: boolean;
  onPress: (id: string) => void;
}

function statusColor(status: string) {
  switch (status) {
    case "RECEIVED":
    case "TRIAGED":
      return emergencyColors.pending;
    case "ASSIGNED":
      return emergencyColors.assigned;
    case "ON_SITE":
    case "IN_TRANSFER":
      return emergencyColors.active;
    case "CLOSED":
    case "CANCELED":
      return emergencyColors.done;
    default:
      return emergencyColors.pending;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

export default function EmergencyCard({ emergency, isSelected, onPress }: Props) {
  const { alert, status, triage } = emergency;
  const patientName = alert.medicalInfo
    ? `${alert.medicalInfo.firstName} ${alert.medicalInfo.lastName}`
    : "Paciente desconocido";

  const color = statusColor(status);
  const hasTriage = triage !== null;
  const triageColor = hasTriage
    ? Object.values(triage!).some((v) => v)
      ? triageColors.critical
      : triageColors.mild
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onPress(emergency.id)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.alertLabel}>Alerta</Text>
        <Text style={styles.time}>{formatTime(alert.reportedOn)}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        {triageColor && (
          <View style={[styles.triageDot, { backgroundColor: triageColor }]} />
        )}
        <Text style={styles.patientName}>{patientName}</Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: color.bg, borderColor: color.border },
        ]}
      >
        <Text style={[styles.statusText, { color: color.text }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
}
