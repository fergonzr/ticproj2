import type { ReactNode } from "react";
import { type OperatorEmergency, formatPatientName } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import NavIcon from "./NavIcon";
import AppButton from "./AppButton";
import type { PriorityInfo } from "../../hooks/operator/triagePriority";
import { statusInfo, formatTime } from "../../hooks/operator/statusScheme";

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

/** Labels for the paramedic's complexity retriage (ComplexityLevel 0/1/2). */
const COMPLEXITY_LABELS: Record<number, string> = {
  0: str.complexityBasic,
  1: str.complexityIntermediate,
  2: str.complexityHigh,
};

export default function DetailPanel({
  emergency,
  triagePriority,
  paramedic,
  onBack,
  onAction,
}: Props) {
  const { label, scheme } = statusInfo(emergency.state);
  const patient = formatPatientName(emergency);
  const hasLocation = emergency.location != null;
  const address = emergency.location
    ? `${emergency.location.latitude.toFixed(4)}, ${emergency.location.longitude.toFixed(4)}`
    : str.operatorLocationUnavailable;

  return (
    <div className="w-[340px] border-r border-op-border bg-op-surface flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-op-border flex items-center gap-[10px]">
        <button type="button" className="bg-transparent border-0 cursor-pointer text-op-primary flex p-1" onClick={onBack} aria-label="Volver">
          <NavIcon type="back" size={18} />
        </button>
        <span className="text-[15px] font-bold text-op-text">{str.operatorAlertLabel(emergency.filingNumber)}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Section label={str.operatorSectionStatus}>
          <span
            className="inline-block px-3 py-[3px] rounded-[6px] text-[12px] font-bold"
            style={{ background: scheme.bg, color: scheme.text, border: `1px solid ${scheme.border}` }}
          >
            {label}
          </span>
        </Section>
        <Section label={str.operatorSectionPatient}>{patient}</Section>
        <Section label={str.operatorSectionLocation}>
          <div className={`flex items-start gap-[6px]${hasLocation ? "" : " text-op-text-ter italic"}`}>
            <NavIcon type="location" size={14} /> {address}
          </div>
        </Section>
        <Section label={str.operatorSectionReportTime}>{formatTime(emergency.reportedOn)}</Section>

        {triagePriority && (
          <Section label={str.operatorSectionTriage}>
            <div
              className="inline-block px-[14px] py-1 rounded-[6px] text-[13px] font-bold"
              style={{
                background: triagePriority.color.bg,
                color: triagePriority.color.text,
                border: `1.5px solid ${triagePriority.color.border}`,
              }}
            >
              {triagePriority.label}
            </div>
          </Section>
        )}

        {emergency.complexityLevel != null && (
          <Section label="Complejidad (retriaje del paramédico)">
            <div className="inline-block px-[14px] py-1 rounded-[6px] text-[13px] font-bold bg-op-bg text-op-text border border-op-border">
              {COMPLEXITY_LABELS[emergency.complexityLevel] ?? `Nivel ${emergency.complexityLevel}`}
            </div>
          </Section>
        )}

        {paramedic && (
          <Section label={str.operatorSectionParamedic}>
            <div className="flex items-center gap-[10px] bg-op-bg p-[10px] rounded-[8px]">
              <div className="w-8 h-8 rounded-full bg-op-primary text-white flex items-center justify-center text-[12px] font-bold">
                {paramedic.initials}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{paramedic.name}</div>
                <div className="text-[11px] text-op-text-sec">{str.operatorEtaLabel(paramedic.etaMin)}</div>
              </div>
            </div>
          </Section>
        )}

        {emergency.transferedTo && (
          <Section label="Traslado a">
            <div className="flex items-start gap-[6px]">
              <NavIcon type="hospital" size={14} /> {emergency.transferedTo.name}
            </div>
          </Section>
        )}

        {emergency.prehospitalCareReportSent && (
          <Section label="Reporte prehospitalario">
            <span className="inline-block px-[10px] py-[3px] rounded-[6px] text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Enviado por el paramédico
            </span>
          </Section>
        )}

        <Section label={str.operatorSectionNotes}>
          <div className="[border:1.5px_dashed_#e5e7eb] rounded-[8px] p-[10px] min-h-[60px] text-[12px] text-op-text-ter italic">
            {str.operatorNotesPlaceholder}
          </div>
        </Section>
      </div>

      <div className="px-4 py-3 border-t border-op-border flex flex-col gap-2">
        <ActionsFor state={emergency.state} onAction={onAction} />
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-bold text-op-text-ter tracking-[0.8px] uppercase mb-1">{label}</div>
      <div className="text-[13px] text-op-text leading-[1.6]">{children}</div>
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
    case "TAKEN":
      return (
        <>
          <AppButton icon="triage" title={str.operatorDoTriage} onPress={() => onAction("triage")} fullWidth />
          <AppButton icon="edit" title={str.operatorEditEmergency} onPress={() => onAction("edit")} variant="outline" fullWidth />
          <AppButton icon="phone" title={str.operatorCallCitizen} onPress={() => onAction("callCitizen")} variant="outline" fullWidth />
          <AppButton icon="cancel" title={str.operatorCancelAlert} onPress={() => onAction("cancelAlert")} variant="outline" fullWidth />
        </>
      );
    case "TRIAGED":
      return (
        <>
          <AppButton icon="assign" title={str.operatorAssignParamedic} onPress={() => onAction("assign")} fullWidth />
          <AppButton icon="phone" title={str.operatorCallCitizen} onPress={() => onAction("callCitizen")} variant="outline" fullWidth />
          <AppButton icon="triage" title={str.operatorViewTriage} onPress={() => onAction("triage")} variant="outline" fullWidth />
          <AppButton icon="cancel" title={str.operatorCancelAlert} onPress={() => onAction("cancelAlert")} variant="outline" fullWidth />
        </>
      );
    case "ASSIGNED":
    case "ON_SITE":
    case "IN_TRANSFER":
      return (
        <>
          <AppButton icon="phone" title={str.operatorCallParamedic} onPress={() => onAction("callParamedic")} variant="outline" fullWidth />
          <AppButton icon="hospital" title={str.operatorCallHospital} onPress={() => onAction("callHospital")} variant="outline" fullWidth />
        </>
      );
    case "SOLVED":
      return (
        <>
          <AppButton icon="phone" title={str.operatorCallParamedic} onPress={() => onAction("callParamedic")} variant="outline" fullWidth />
          <AppButton icon="close" title={str.operatorCloseCase} onPress={() => onAction("close")} variant="danger" fullWidth />
        </>
      );
    default:
      return null;
  }
}
