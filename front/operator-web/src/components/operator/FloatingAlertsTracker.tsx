import { useEffect, useState } from "react";
import type { OperatorEmergency } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import { statusInfo, minutesSince } from "../../hooks/operator/statusScheme";

interface Props {
  alerts: OperatorEmergency[];
  activeAlertId: string | null;
  onSelect: (id: string) => void;
  narrowViewport?: boolean;
}

export default function FloatingAlertsTracker({
  alerts,
  activeAlertId,
  onSelect,
  narrowViewport = false,
}: Props) {
  const [open, setOpen] = useState(!narrowViewport);

  useEffect(() => {
    if (narrowViewport) setOpen(false);
  }, [narrowViewport]);

  if (alerts.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        title={str.operatorTrackerToggleOpen}
        aria-label={str.operatorTrackerToggleOpen}
        onClick={() => setOpen(true)}
        className="absolute top-4 left-4 w-11 h-11 rounded-full bg-op-primary text-white border-0 cursor-pointer shadow-[0_4px_12px_rgba(37,121,133,0.35)] flex items-center justify-center z-[5] font-bold text-[14px] [font-variant-numeric:tabular-nums] relative"
      >
        {alerts.length}
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] rounded-[9px] bg-op-error text-white text-[10px] font-bold leading-[18px] text-center [border:2px_solid_#fff] [font-variant-numeric:tabular-nums]">
          {alerts.length > 9 ? "9+" : alerts.length}
        </span>
      </button>
    );
  }

  return (
    <div
      className="absolute top-4 left-4 w-[248px] max-h-[calc(100%-32px)] bg-op-surface border border-op-border rounded-[10px] shadow-[0_6px_20px_rgba(15,23,42,0.08)] flex flex-col z-[5] overflow-hidden"
      role="region"
      aria-label={str.operatorTrackerTitle}
    >
      <div className="flex items-center justify-between px-3 py-[10px] border-b border-op-border-light">
        <span className="text-[12px] font-bold text-op-text tracking-[0.3px] uppercase">{str.operatorTrackerTitle}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-op-text-ter [font-variant-numeric:tabular-nums]">{alerts.length}</span>
          <button
            type="button"
            title={str.operatorTrackerToggleClose}
            aria-label={str.operatorTrackerToggleClose}
            onClick={() => setOpen(false)}
            className="bg-transparent border-0 cursor-pointer text-op-text-sec p-1 rounded-[6px] text-[16px] leading-none font-bold flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-2 overflow-y-auto flex flex-col gap-[6px]">
        {alerts.map((em) => {
          const { label, scheme } = statusInfo(em.state);
          const mins = minutesSince(em.reportedOn);
          const isActive = em.id === activeAlertId;
          return (
            <button
              key={em.id}
              type="button"
              onClick={() => onSelect(em.id)}
              className={`flex flex-col gap-1 px-[10px] py-2 border border-op-border border-l-[3px] rounded-[6px] cursor-pointer text-left font-[inherit] transition-[background,border-color] duration-[120ms] ${
                isActive ? "bg-op-primary-light border-op-primary" : "bg-op-surface"
              }`}
              style={{ borderLeftColor: scheme.accent }}
            >
              <div className="flex items-center justify-between gap-[6px]">
                <span className="text-[11px] font-bold text-op-text tracking-[0.4px] [font-variant-numeric:tabular-nums]">
                  {str.formatFilingNumber(em.filingNumber)}
                </span>
                <span className="text-[10px] text-op-text-ter [font-variant-numeric:tabular-nums]">
                  {str.operatorMinutesAgo(mins)}
                </span>
              </div>
              <span
                className="inline-block text-[10px] font-bold px-[6px] py-[1px] rounded-[3px] self-start"
                style={{ background: scheme.bg, color: scheme.text, border: `1px solid ${scheme.border}` }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
