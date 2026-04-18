import type { OperatorEmergency } from "@/lib/api/interfaces";
import { styles } from "../../styles/operator/ControlBar.styles";
import { triageColors } from "@/lib/themes/Colors";
import * as str from "@/lib/strings";
import AppButton from "./AppButton";

interface Props {
  emergency: OperatorEmergency | null;
  triageCritical: boolean | null;
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
  triageCritical,
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
      <div style={styles.container}>
        <span style={styles.emptyText}>{str.operatorNoEmergencySelected}</span>
      </div>
    );
  }

  const state = emergency.state;

  if (state === "ASSIGNED") {
    return (
      <div style={styles.container}>
        <AppButton title={str.operatorCallParamedic} onPress={onCallParamedic} variant="outline" />
        <span style={styles.enRouteText}>{str.operatorEnRoute}</span>
      </div>
    );
  }

  if (state === "ON_SITE" || state === "IN_TRANSFER") {
    return (
      <div style={styles.container}>
        <AppButton title={str.operatorCallHospital} onPress={onCallHospital} variant="outline" />
        <AppButton title={str.operatorCallParamedic} onPress={onCallParamedic} variant="outline" />
        <span style={styles.spacer} />
        <AppButton title={str.operatorCloseCase} onPress={onCloseCase} variant="danger" />
      </div>
    );
  }

  if (state === "TRIAGED") {
    const badgeColor = triageCritical ? triageColors.critical : triageColors.mild;
    return (
      <div style={styles.container}>
        <AppButton title={str.operatorCallCitizen} onPress={onCallCitizen} variant="outline" />
        <button
          style={{ ...styles.triageBadge, borderColor: badgeColor }}
          onClick={onOpenTriage}
          type="button"
        >
          <span style={{ ...styles.triageBadgeText, color: badgeColor }}>
            {triageCritical ? "Triaje: Crítico" : "Triaje: Leve"}
          </span>
        </button>
        <span style={styles.spacer} />
        <AppButton title={str.operatorAssignParamedic} onPress={onAssignParamedic} />
      </div>
    );
  }

  // RECEIVED / default
  return (
    <div style={styles.container}>
      <AppButton title={str.operatorCallCitizen} onPress={onCallCitizen} variant="outline" />
      <AppButton title={str.operatorDoTriage} onPress={onOpenTriage} />
      <AppButton title={str.operatorEditEmergency} onPress={onOpenEdit} variant="outline" />
    </div>
  );
}
