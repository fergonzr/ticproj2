import type { MouseEvent } from "react";
import { type OperatorEmergency, formatPatientName } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import NavIcon from "./NavIcon";
import { statusInfo, formatTime, minutesSince } from "../../hooks/operator/statusScheme";

interface Props {
  emergency: OperatorEmergency;
  isSelected: boolean;
  mode?: "queue" | "myAlerts";
  onPress: (id: string) => void;
  onTake?: (id: string) => void;
}

export default function EmergencyCard({ emergency, isSelected, mode = "queue", onPress, onTake }: Props) {
  const { label, scheme } = statusInfo(emergency.state);
  const patient = formatPatientName(emergency);
  const address = emergency.location
    ? `${emergency.location.latitude.toFixed(4)}, ${emergency.location.longitude.toFixed(4)}`
    : str.operatorLocationUnavailable;
  const mins = minutesSince(emergency.reportedOn);
  const showTakeBtn = mode === "queue";
  const canTake = showTakeBtn && (emergency.state === "RECEIVED" || emergency.state === "TRIAGED");

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <button
      type="button"
      className={`block w-full text-left [border:1.5px_solid] rounded-lg py-3 bg-op-surface cursor-pointer transition-all mb-[6px] relative font-[inherit] ${
        isSelected
          ? "border-op-primary bg-op-primary-light"
          : "border-op-border"
      }`}
      style={{ paddingLeft: 14, paddingRight: showTakeBtn ? 44 : 14 }}
      onClick={() => onPress(emergency.id)}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-op-text-ter font-semibold tracking-[0.5px]">ALT-{emergency.id.slice(-3)}</span>
        <span className="text-[11px] text-op-text-ter">{formatTime(emergency.reportedOn)}</span>
      </div>
      <div className="text-[14px] font-semibold text-op-text mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{patient}</div>
      <div className="text-[12px] text-op-text-sec mb-2 flex items-center gap-1">
        <NavIcon type="location" size={12} /> {address}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] font-semibold px-[10px] py-[2px] rounded-[4px]"
          style={{ background: scheme.bg, color: scheme.text, border: `1px solid ${scheme.border}` }}
        >
          {label}
        </span>
        <span className="text-[11px] text-op-text-ter">{str.operatorMinutesAgo(mins)}</span>
      </div>
      {showTakeBtn && (
        <span
          role="button"
          aria-label="Tomar alerta"
          onClick={(e) => { stop(e); onTake?.(emergency.id); }}
          onPointerDown={stop}
          className={`absolute top-1/2 right-[10px] -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer font-bold z-[2] border-0 p-0 ${
            canTake
              ? "w-7 h-7 bg-op-primary text-white text-[14px] [box-shadow:0_2px_6px_rgba(37,121,133,.3)]"
              : "w-6 h-6 bg-op-bg text-op-text-ter text-[13px]"
          }`}
        >
          ›
        </span>
      )}
    </button>
  );
}
