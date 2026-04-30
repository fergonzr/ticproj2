import type { OperatorEmergency } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import AppButton from "./AppButton";
import NavIcon from "./NavIcon";
import { statusInfo, formatTime } from "../../hooks/operator/statusScheme";
import { styles } from "../../styles/operator/ConfirmModal.styles";

interface Props {
  emergency: OperatorEmergency | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ emergency, onConfirm, onCancel }: Props) {
  if (!emergency) return null;
  const { label, scheme } = statusInfo(emergency.state);
  const patient = emergency.medicalInfo?.trim() || "Paciente desconocido";
  const address = `${emergency.location.latitude.toFixed(4)}, ${emergency.location.longitude.toFixed(4)}`;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{str.operatorTakeAlertTitle}</h3>
        <div style={styles.summary}>
          <div style={styles.summaryHeader}>
            <span style={styles.patientName}>{patient}</span>
            <span
              style={{
                ...styles.statusBadge,
                background: scheme.bg,
                color: scheme.text,
              }}
            >
              {label}
            </span>
          </div>
          <div style={styles.infoList}>
            <div style={styles.infoRow}>
              <NavIcon type="location" size={14} /> {address}
            </div>
            <div>{formatTime(emergency.reportedOn)}</div>
          </div>
        </div>
        <p style={styles.note}>{str.operatorTakeAlertNote}</p>
        <div style={styles.footer}>
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title={str.operatorTakeAlertAction} onPress={onConfirm} />
        </div>
      </div>
    </div>
  );
}
