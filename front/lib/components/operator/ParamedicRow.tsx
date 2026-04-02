import { View, Text, TouchableOpacity } from "react-native";
import { ParamedicWithStatus } from "@/lib/hooks/operator/useOperatorWS";
import { styles } from "@/lib/styles/operator/ParamedicRow.styles";
import { paramedicStatusColors } from "@/lib/themes/Colors";
import { paramedicStatusLabels } from "@/lib/strings";

interface Props {
  paramedic: ParamedicWithStatus;
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
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{paramedic.name}</Text>
        <Text style={styles.distance}>{distanceLabel}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderWidth: 1, borderColor: sc.border }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{statusLabel}</Text>
        </View>
      </View>
      {canAssign && (
        <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign(paramedic.id)} activeOpacity={0.8}>
          <Text style={styles.assignBtnText}>Asignar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}