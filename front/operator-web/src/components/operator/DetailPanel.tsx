import type { ReactNode } from "react";
import type { OperatorEmergency } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import NavIcon from "./NavIcon";
import AppButton from "./AppButton";
import type { PriorityInfo } from "../../hooks/operator/triagePriority";
import { statusInfo, formatTime } from "../../hooks/operator/statusScheme";
import { styles } from "../../styles/operator/DetailPanel.styles";

export type DetailAction =
  | "triage"
  | "edit"
  | "callCitizen"
  | "assign"
  | "callParamedic"
  | "callHospital"
  | "cancelAlert"
  | "close";

export interface ParamedicSummary {
  name: string;
  initials: string;
  etaMin: number;
}

interface Props {
  emergency: OperatorEmergency;
  triagePriority: PriorityInfo | null;
  paramedic: ParamedicSummary | null;
  onBack: () => void;
  onAction: (action: DetailAction) => void;
}

export default function DetailPanel({
  emergency,
  triagePriority,
  paramedic,
  onBack,
  onAction,
}: Props) {
  const { label, scheme } = statusInfo(emergency.state);
  const patient = emergency.medicalInfo?.trim() || "Paciente desconocido";
  const address = `${emergency.location.latitude.toFixed(4)}, ${emergency.location.longitude.toFixed(4)}`;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button type="button" style={styles.backBtn} onClick={onBack} aria-label="Volver">
          <NavIcon type="back" size={18} />
        </button>
        <span style={styles.headerTitle}>{str.operatorAlertLabel(emergency.id)}</span>
      </div>

      <div style={styles.body}>
        <Section label={str.operatorSectionStatus}>
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
        </Section>
        <Section label={str.operatorSectionPatient}>{patient}</Section>
        <Section label={str.operatorSectionLocation}>
          <div style={styles.locationRow}>
            <NavIcon type="location" size={14} /> {address}
          </div>
        </Section>
        <Section label={str.operatorSectionReportTime}>{formatTime(emergency.reportedOn)}</Section>

        {triagePriority && (
          <Section label={str.operatorSectionTriage}>
            <div
              style={{
                ...styles.priorityBadge,
                background: triagePriority.color.bg,
                color: triagePriority.color.text,
                border: `1.5px solid ${triagePriority.color.border}`,
              }}
            >
              {triagePriority.label}
            </div>
          </Section>
        )}

        {paramedic && (
          <Section label={str.operatorSectionParamedic}>
            <div style={styles.paramedicCard}>
              <div style={styles.paramedicAvatar}>{paramedic.initials}</div>
              <div>
                <div style={styles.paramedicName}>{paramedic.name}</div>
                <div style={styles.paramedicEta}>{str.operatorEtaLabel(paramedic.etaMin)}</div>
              </div>
            </div>
          </Section>
        )}

        <Section label={str.operatorSectionNotes}>
          <div style={styles.notesBox}>{str.operatorNotesPlaceholder}</div>
        </Section>
      </div>

      <div style={styles.actions}>
        <ActionsFor state={emergency.state} onAction={onAction} />
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionLabel}>{label}</div>
      <div style={styles.sectionValue}>{children}</div>
    </div>
  );
}

function ActionsFor({
  state,
  onAction,
}: {
  state: string;
  onAction: (a: DetailAction) => void;
}) {
  switch (state) {
    case "RECEIVED":
      return (
        <>
          <AppButton icon="triage" title={str.operatorDoTriage} onPress={() => onAction("triage")} fullWidth />
          <AppButton icon="edit" title={str.operatorEditEmergency} onPress={() => onAction("edit")} variant="outline" fullWidth />
          <AppButton icon="phone" title={str.operatorCallCitizen} onPress={() => onAction("callCitizen")} variant="outline" fullWidth />
        </>
      );
    case "TRIAGED":
      return (
        <>
          <AppButton icon="assign" title={str.operatorAssignParamedic} onPress={() => onAction("assign")} fullWidth />
          <AppButton icon="phone" title={str.operatorCallCitizen} onPress={() => onAction("callCitizen")} variant="outline" fullWidth />
          <AppButton icon="triage" title={str.operatorViewTriage} onPress={() => onAction("triage")} variant="outline" fullWidth />
        </>
      );
    case "ASSIGNED":
    case "ON_SITE":
    case "IN_TRANSFER":
      return (
        <>
          <AppButton icon="phone" title={str.operatorCallParamedic} onPress={() => onAction("callParamedic")} variant="outline" fullWidth />
          <AppButton icon="hospital" title={str.operatorCallHospital} onPress={() => onAction("callHospital")} variant="outline" fullWidth />
          <AppButton icon="cancel" title={str.operatorCancelAlert} onPress={() => onAction("cancelAlert")} variant="outline" fullWidth />
          <AppButton icon="close" title={str.operatorCloseCase} onPress={() => onAction("close")} variant="danger" fullWidth />
        </>
      );
    default:
      return null;
  }
}
