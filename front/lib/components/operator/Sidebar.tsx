import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeEmergency, ParamedicLocation, GeoLocation } from "@/lib/models";
import { styles } from "@/lib/styles/operator/Sidebar.styles";
import { distanceKm } from "@/lib/utils/location";
import EmergencyCard from "./EmergencyCard";
import ParamedicRow from "./ParamedicRow";

interface Props {
  mode: "emergencies" | "paramedics";
  emergencies: SafeEmergency[];
  selectedId: string | null;
  paramedics: ParamedicLocation[];
  selectedEmergencyLocation: GeoLocation | null;
  onSelectEmergency: (id: string) => void;
  onAssignParamedic: (id: string) => void;
  onChangeMode: (mode: "emergencies" | "paramedics") => void;
}

export default function Sidebar({
  mode,
  emergencies,
  selectedId,
  paramedics,
  selectedEmergencyLocation,
  onSelectEmergency,
  onAssignParamedic,
  onChangeMode,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {(["emergencies", "paramedics"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, mode === tab && styles.tabActive]}
            onPress={() => onChangeMode(tab)}
          >
            <Text
              style={[styles.tabText, mode === tab && styles.tabTextActive]}
            >
              {tab === "emergencies" ? "Alertas" : "Paramédicos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === "emergencies" ? (
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
      ) : (
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
      )}
    </View>
  );
}
