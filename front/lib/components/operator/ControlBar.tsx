import { View, Text, TouchableOpacity } from "react-native";
import { SafeEmergency } from "@/lib/models";
import { styles } from "@/lib/styles/operator/ControlBar.styles";
import { triageColors } from "@/lib/themes/Colors";
import * as str from "@/lib/strings";
import AppButton from "@/lib/components/AppButton";

interface Props {
  emergency: SafeEmergency | null;
  onCallCitizen: () => void;
  onCallParamedic: () => void;
  onCallHospital: () => void;
  onOpenTriage: () => void;
  onOpenEdit: () => void;
  onAssignParamedic: () => void;
  onCloseCase: () => void;
}

export default function ControlBar({
  emergency,
  onCallCitizen,
  onCallParamedic,
  onCallHospital,
  onOpenTriage,
  onOpenEdit,
  onAssignParamedic,
  onCloseCase,
}: Props) {
  if (!emergency) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{str.operatorNoEmergencySelected}</Text>
      </View>
    );
  }

  const { status, triage, assignedTo } = emergency;

  if (status === "ASSIGNED") {
    return (
      <View style={styles.container}>
        <AppButton title={str.operatorCallParamedic} onPress={onCallParamedic} variant="outline" />
        <Text style={styles.enRouteText}>
          {str.operatorEnRoute} — {assignedTo?.name ?? ""}
        </Text>
      </View>
    );
  }

  if (status === "ON_SITE" || status === "IN_TRANSFER") {
    return (
      <View style={styles.container}>
        <AppButton title={str.operatorCallHospital} onPress={onCallHospital} variant="outline" />
        <AppButton title={str.operatorCallParamedic} onPress={onCallParamedic} variant="outline" />
        <View style={styles.spacer} />
        <AppButton title={str.operatorCloseCase} onPress={onCloseCase} variant="danger" />
      </View>
    );
  }

  if (triage !== null) {
    const isCritical = Object.values(triage).some((v) => v);
    const badgeColor = isCritical ? triageColors.critical : triageColors.mild;
    return (
      <View style={styles.container}>
        <AppButton title={str.operatorCallCitizen} onPress={onCallCitizen} variant="outline" />
        <TouchableOpacity
          style={[styles.triageBadge, { borderColor: badgeColor }]}
          onPress={onOpenTriage}
        >
          <Text style={[styles.triageBadgeText, { color: badgeColor }]}>
            {isCritical ? "Triaje: Crítico" : "Triaje: Leve"}
          </Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <AppButton title={str.operatorAssignParamedic} onPress={onAssignParamedic} />
      </View>
    );
  }

  // RECEIVED / no triage
  return (
    <View style={styles.container}>
      <AppButton title={str.operatorCallCitizen} onPress={onCallCitizen} variant="outline" />
      <AppButton title={str.operatorDoTriage} onPress={onOpenTriage} />
      <AppButton title={str.operatorEditEmergency} onPress={onOpenEdit} variant="outline" />
    </View>
  );
}
