import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeEmergency, GeoLocation } from "@/lib/models";
import { ParamedicWithStatus } from "@/lib/hooks/operator/useOperatorWS";
import { styles } from "@/lib/styles/operator/Sidebar.styles";
import { distanceKm } from "@/lib/utils/location";
import EmergencyCard from "./EmergencyCard";
import ParamedicRow from "./ParamedicRow";

interface Props {
  mode: "emergencies" | "paramedics";
  emergencies: SafeEmergency[];
  selectedId: string | null;
  paramedics: ParamedicWithStatus[];
  selectedEmergencyLocation: GeoLocation | null;
  onSelectEmergency: (id: string) => void;
  onAssignParamedic: (id: string) => void;
  onBackToEmergencies?: () => void;
}

export default function Sidebar({
  mode,
  emergencies,
  selectedId,
  paramedics,
  selectedEmergencyLocation,
  onSelectEmergency,
  onAssignParamedic,
  onBackToEmergencies,
}: Props) {
  if (mode === "paramedics") {
    return (
      <View style={styles.container}>
        {onBackToEmergencies && (
          <TouchableOpacity style={styles.backBar} onPress={onBackToEmergencies}>
            <Text style={styles.backText}>←</Text>
            <Text style={styles.backLabel}>Paramédicos</Text>
          </TouchableOpacity>
        )}
        <FlatList
          style={styles.list}
          data={paramedics}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <ParamedicRow
              paramedic={item}
              distanceKm={
                selectedEmergencyLocation
                  ? parseFloat(
                      distanceKm(selectedEmergencyLocation, item.location).toFixed(1)
                    )
                  : null
              }
              onAssign={onAssignParamedic}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Sin paramédicos disponibles</Text>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Alertas activas</Text>
      </View>
      <FlatList
        style={styles.list}
        data={emergencies}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <EmergencyCard
            emergency={item}
            isSelected={item.id === selectedId}
            onPress={onSelectEmergency}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Sin alertas activas</Text>
        }
      />
    </View>
  );
}