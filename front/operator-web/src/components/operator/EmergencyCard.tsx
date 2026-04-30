import type { MouseEvent } from "react";
import type { OperatorEmergency } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import NavIcon from "./NavIcon";
import { statusInfo, formatTime, minutesSince } from "../../hooks/operator/statusScheme";
import { styles } from "../../styles/operator/EmergencyCard.styles";

interface Props {
  emergency: OperatorEmergency;
  isSelected: boolean;
  mode?: "queue" | "myAlerts";
  onPress: (id: string) => void;
  onTake?: (id: string) => void;
}

export default function EmergencyCard({ emergency, isSelected, mode = "queue", onPress, onTake }: Props) {
  const { label, scheme } = statusInfo(emergency.state);
  const patient = emergency.medicalInfo?.trim() || "Paciente desconocido";
  const address = `${emergency.location.latitude.toFixed(4)}, ${emergency.location.longitude.toFixed(4)}`;
  const mins = minutesSince(emergency.reportedOn);
  const showTakeBtn = mode === "queue";
  const canTake = showTakeBtn && (emergency.state === "RECEIVED" || emergency.state === "TRIAGED");

  const cardStyle = {
    ...styles.card,
    ...(isSelected ? styles.cardSelected : null),
    paddingRight: showTakeBtn ? 44 : 14,
  };

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <button type="button" style={cardStyle} onClick={() => onPress(emergency.id)}>
      <div style={styles.topRow}>
        <span style={styles.alertId}>ALT-{emergency.id.slice(-3)}</span>
        <span style={styles.time}>{formatTime(emergency.reportedOn)}</span>
      </div>
      <div style={styles.patientName}>{patient}</div>
      <div style={styles.addressRow}>
        <NavIcon type="location" size={12} /> {address}
      </div>
      <div style={styles.bottomRow}>
        <span
          style={{
            ...styles.statusBadge,
            background: scheme.bg,
            color: scheme.text,
            border: `1px solid ${scheme.border}`,
          }}
        >
          {label}
        </span>
        <span style={styles.minutesAgo}>{str.operatorMinutesAgo(mins)}</span>
      </div>
      {showTakeBtn && (
        <span
          role="button"
          aria-label="Tomar alerta"
          onClick={(e) => {
            stop(e);
            onTake?.(emergency.id);
          }}
          onPointerDown={stop}
          style={canTake ? styles.takeBtn : styles.takeBtnSubtle}
        >
          ›
        </span>
      )}
    </button>
  );
}
