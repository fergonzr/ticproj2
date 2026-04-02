import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "@/lib/styles/operator/Topbar.styles";
import * as str from "@/lib/strings";

interface ParamedicCounts {
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
  { key: "available",    label: "Disponible",       dot: "#3fb950" },
  { key: "onRoute",      label: "En curso",          dot: "#e3b341" },
  { key: "outOfService", label: "Fuera de servicio", dot: "#8b949e" },
];

export default function Topbar({ operatorName, paramedicCounts, onLogout }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{str.operatorDashboardTitle}</Text>

      <View style={styles.statusRow}>
        {STATUS_CHIPS.map(({ key, label, dot }) => (
          <View key={key} style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: dot }]} />
            <Text style={styles.statusChipText}>
              {label}{" "}
              <Text style={styles.statusCount}>{paramedicCounts[key]}</Text>
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.right}>
        <Text style={styles.operatorName}>{operatorName}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>{str.logout}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}