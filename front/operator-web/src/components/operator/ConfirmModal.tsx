import { type OperatorEmergency, formatPatientName } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import AppButton from "./AppButton";
import NavIcon from "./NavIcon";
import { statusInfo, formatTime } from "../../hooks/operator/statusScheme";

interface Props {
  emergency: OperatorEmergency | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ emergency, onConfirm, onCancel }: Props) {
  if (!emergency) return null;
  const { label, scheme } = statusInfo(emergency.state);
  const patient = formatPatientName(emergency);
  const address = `${emergency.location.latitude.toFixed(4)}, ${emergency.location.longitude.toFixed(4)}`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] backdrop-blur-[2px]" onClick={onCancel}>
      <div className="bg-op-surface rounded-[14px] p-7 w-[400px] shadow-[0_20px_60px_rgba(0,0,0,.2)]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[18px] font-bold text-op-text m-0 mb-4">{str.operatorTakeAlertTitle}</h3>
        <div className="bg-op-bg rounded-[10px] p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-semibold text-op-text">{patient}</span>
            <span
              className="text-[11px] px-2 py-[2px] rounded-[4px] font-semibold"
              style={{ background: scheme.bg, color: scheme.text }}
            >
              {label}
            </span>
          </div>
          <div className="text-[13px] text-op-text-sec leading-[1.8] flex flex-col gap-[2px]">
            <div className="flex items-center gap-[6px]">
              <NavIcon type="location" size={14} /> {address}
            </div>
            <div>{formatTime(emergency.reportedOn)}</div>
          </div>
        </div>
        <p className="text-[12px] text-op-text-ter mb-5 leading-[1.5]">{str.operatorTakeAlertNote}</p>
        <div className="flex gap-[10px] justify-end">
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title={str.operatorTakeAlertAction} onPress={onConfirm} />
        </div>
      </div>
    </div>
  );
}
