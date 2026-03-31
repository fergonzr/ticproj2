import { ReactElement, useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApi } from "@/lib/api/useApi";
import { useOperatorUser } from "@/lib/hooks/useOperatorUser";
import { OperatorEmergency, TriageData } from "@/lib/api/interfaces";
import AppButton from "@/lib/components/AppButton";
import * as str from "@/lib/strings";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

// --- Helpers ---

function stateLabel(state: string): string {
  switch (state) {
    case "RECEIVED":
      return str.operatorStateReceived;
    case "TRIAGED":
      return str.operatorStateTriaged;
    case "ASSIGNED":
      return str.operatorStateAssigned;
    case "ON_SITE":
      return str.operatorStateOnsite;
    default:
      return str.operatorStateUnknown;
  }
}

function stateColor(state: string): string {
  switch (state) {
    case "RECEIVED":
      return colors.error;
    case "TRIAGED":
      return colors.warning;
    case "ASSIGNED":
      return colors.primary;
    case "ON_SITE":
      return colors.success;
    default:
      return colors.placeholder;
  }
}

// --- Component ---

/**
 * Main dashboard for the operator role.
 * Connects to the coordination WebSocket and lets the operator
 * triage emergencies and assign paramedics.
 */
export default function OperatorDashboard(): ReactElement {
  const { operatorUser } = useOperatorUser();
  const { operatorService } = useApi();

  const [emergencies, setEmergencies] = useState<OperatorEmergency[]>([]);
  const [triageTarget, setTriageTarget] = useState<OperatorEmergency | null>(null);
  const [assignTarget, setAssignTarget] = useState<OperatorEmergency | null>(null);
  const [triage, setTriage] = useState<TriageData>({
    bleeding: false, dizziness: false, blurred_vision: false, unconscious: false,
    difficulty_breathing: false, fracture: false, chest_pain: false, numbness_limbs: false,
  });
  const [paramedicId, setParamedicId] = useState("");

  // Connect to operator WebSocket on mount.
  useEffect(() => {
    if (!operatorUser) return;

    operatorService.connect(operatorUser.token, (event) => {
      switch (event.type) {
        case "initial_queue":
          setEmergencies(event.emergencies);
          break;
        case "emergency_received":
          setEmergencies((prev) => [...prev, event.emergency]);
          break;
        case "emergency_triaged":
          setEmergencies((prev) =>
            prev.map((e) =>
              e.id === event.emergencyId ? { ...e, state: "TRIAGED" } : e,
            ),
          );
          break;
        case "emergency_assigned":
          setEmergencies((prev) =>
            prev.map((e) =>
              e.id === event.emergencyId ? { ...e, state: "ASSIGNED" } : e,
            ),
          );
          break;
        case "emergency_arrived":
          setEmergencies((prev) =>
            prev.map((e) =>
              e.id === event.emergencyId ? { ...e, state: "ON_SITE" } : e,
            ),
          );
          break;
        case "error":
          Alert.alert(str.alertError, event.message);
          break;
      }
    });

    return () => operatorService.disconnect();
  }, [operatorUser, operatorService]);

  // --- Triage ---

  const EMPTY_TRIAGE: TriageData = {
    bleeding: false, dizziness: false, blurred_vision: false, unconscious: false,
    difficulty_breathing: false, fracture: false, chest_pain: false, numbness_limbs: false,
  };

  const openTriage = useCallback((emergency: OperatorEmergency) => {
    setTriage(EMPTY_TRIAGE);
    setTriageTarget(emergency);
  }, []);

  const handleTriage = useCallback(() => {
    if (!triageTarget) return;
    operatorService.triageEmergency(triageTarget.id, triage);
    setTriageTarget(null);
  }, [triageTarget, triage, operatorService]);

  // --- Assign paramedic ---

  const openAssign = useCallback((emergency: OperatorEmergency) => {
    setParamedicId("");
    setAssignTarget(emergency);
  }, []);

  const handleAssign = useCallback(() => {
    if (!assignTarget) return;
    if (!paramedicId.trim()) {
      Alert.alert(str.alertError, str.alertOperatorAssignIdRequired);
      return;
    }
    operatorService.assignParamedic(assignTarget.id, paramedicId.trim());
    setAssignTarget(null);
    setParamedicId("");
  }, [assignTarget, paramedicId, operatorService]);

  // --- Render ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{str.operatorDashboardTitle}</Text>
        {operatorUser && (
          <Text style={styles.headerSubtitle}>{operatorUser.name}</Text>
        )}
      </View>

      {/* Emergency list */}
      <ScrollView contentContainerStyle={styles.list}>
        {emergencies.length === 0 ? (
          <Text style={styles.emptyText}>{str.operatorNoEmergencies}</Text>
        ) : (
          emergencies.map((emergency) => (
            <EmergencyCard
              key={emergency.id}
              emergency={emergency}
              onTriage={() => openTriage(emergency)}
              onAssign={() => openAssign(emergency)}
            />
          ))
        )}
      </ScrollView>

      {/* Triage modal */}
      <Modal
        visible={triageTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTriageTarget(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{str.operatorTriageTitle}</Text>
            <Text style={styles.modalSubtitle}>
              #{triageTarget?.id.slice(-6)}
            </Text>

            {([
              ["bleeding", str.triageBleeding],
              ["dizziness", str.triageDizziness],
              ["blurred_vision", str.triageBlurredVision],
              ["unconscious", str.triageUnconscious],
              ["difficulty_breathing", str.triageDifficultyBreathing],
              ["fracture", str.triageFracture],
              ["chest_pain", str.triageChestPain],
              ["numbness_limbs", str.triageNumbnessLimbs],
            ] as [keyof TriageData, string][]).map(([field, label]) => (
              <ToggleRow
                key={field}
                label={label}
                value={triage[field]}
                onToggle={() => setTriage((prev) => ({ ...prev, [field]: !prev[field] }))}
              />
            ))}

            <View style={styles.modalActions}>
              <AppButton
                variant="outline"
                title={str.btnCancel}
                onPress={() => setTriageTarget(null)}
                style={{ flex: 1 }}
              />
              <AppButton
                title={str.btnTriage}
                onPress={handleTriage}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign paramedic modal */}
      <Modal
        visible={assignTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignTarget(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{str.operatorAssignTitle}</Text>
            <Text style={styles.modalSubtitle}>
              #{assignTarget?.id.slice(-6)}
            </Text>

            <Text style={styles.inputLabel}>{str.operatorParamedicIdLabel}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={str.operatorParamedicIdPlaceholder}
              value={paramedicId}
              onChangeText={setParamedicId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <AppButton
                variant="outline"
                title={str.btnCancel}
                onPress={() => setAssignTarget(null)}
                style={{ flex: 1 }}
              />
              <AppButton
                title={str.btnAssign}
                onPress={handleAssign}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Sub-components ---

type EmergencyCardProps = {
  emergency: OperatorEmergency;
  onTriage: () => void;
  onAssign: () => void;
};

function EmergencyCard({
  emergency,
  onTriage,
  onAssign,
}: EmergencyCardProps): ReactElement {
  const canTriage = emergency.state === "RECEIVED";
  const canAssign = emergency.state === "TRIAGED";
  const dot = stateColor(emergency.state);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text style={styles.cardId}>#{emergency.id.slice(-6)}</Text>
        <Text style={[styles.cardState, { color: dot }]}>
          {stateLabel(emergency.state)}
        </Text>
      </View>

      <Text style={styles.cardDetail}>
        {str.operatorLocation}: {emergency.location.latitude.toFixed(4)},{" "}
        {emergency.location.longitude.toFixed(4)}
      </Text>
      {Boolean(emergency.medicalInfo) && (
        <Text style={styles.cardDetail} numberOfLines={2}>
          {str.operatorMedicalInfo}: {emergency.medicalInfo}
        </Text>
      )}

      {(canTriage || canAssign) && (
        <View style={styles.cardActions}>
          {canTriage && (
            <AppButton
              title={str.btnTriage}
              onPress={onTriage}
              style={{ flex: 1 }}
            />
          )}
          {canAssign && (
            <AppButton
              title={str.btnAssign}
              onPress={onAssign}
              style={{ flex: 1 }}
            />
          )}
        </View>
      )}
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onToggle: () => void;
};

function ToggleRow({ label, value, onToggle }: ToggleRowProps): ReactElement {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleBox, value && styles.toggleBoxActive]}>
        {value && <Text style={styles.toggleCheck}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: colors.whiteAlpha,
    fontSize: 14,
    marginTop: 2,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyText: {
    textAlign: "center",
    color: colors.placeholder,
    marginTop: spacing.xxl,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  cardId: {
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
  },
  cardState: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardDetail: {
    fontSize: 13,
    color: colors.placeholder,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    width: "85%",
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.placeholder,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    fontSize: 15,
    flex: 1,
  },
  toggleBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBoxActive: {
    backgroundColor: colors.primary,
  },
  toggleCheck: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
