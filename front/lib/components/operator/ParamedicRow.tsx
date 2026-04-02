import { View, Text, TouchableOpacity } from "react-native";
import { ParamedicLocation } from "@/lib/models";
import { styles } from "@/lib/styles/operator/ParamedicRow.styles";

interface Props {
  paramedic: ParamedicLocation;
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

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{paramedic.name}</Text>
        <Text style={styles.distance}>{distanceLabel}</Text>
      </View>
      <TouchableOpacity
        style={styles.assignBtn}
        onPress={() => onAssign(paramedic.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.assignBtnText}>Asignar</Text>
      </TouchableOpacity>
    </View>
  );
}
