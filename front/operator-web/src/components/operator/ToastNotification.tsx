import { useEffect, type MouseEvent } from "react";
import { operatorToastTones as T } from "@/lib/themes/Colors";

export interface ToastData {
  type: "PARAMEDIC_ACCEPTED" | "EMERGENCY_RECEIVED" | "INFO";
  message: string;
}

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4000;

type Tone = {
  accent: string;
  iconBg: string;
  iconColor: string;
  title: string;
  icon: "bell" | "check" | "info";
};

const TONES: Record<ToastData["type"], Tone> = {
  EMERGENCY_RECEIVED: { ...T.emergency, title: "Nueva alerta",           icon: "bell"  },
  PARAMEDIC_ACCEPTED: { ...T.success,   title: "Asignación confirmada",  icon: "check" },
  INFO:               { ...T.info,      title: "Información",            icon: "info"  },
};

function ToastIcon({ name, color }: { name: Tone["icon"]; color: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "bell")
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  if (name === "check")
    return (
      <svg {...common}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function ToastNotification({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const tone = TONES[toast.type];

  const handleClose = (e: MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  return (
    <div
      key={`${toast.type}-${toast.message}`}
      className="absolute top-5 right-5 min-w-[320px] max-w-[400px] bg-op-surface rounded-[12px] shadow-[0_10px_28px_rgba(15,23,42,0.18),_0_2px_6px_rgba(15,23,42,0.08)] overflow-hidden z-[200] cursor-pointer text-left flex flex-col animate-toast-in"
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <div className="flex items-start gap-3 px-4 py-[14px]">
        <span
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: tone.iconBg }}
        >
          <ToastIcon name={tone.icon} color={tone.iconColor} />
        </span>
        <div className="flex flex-col gap-[2px] flex-1 min-w-0">
          <span className="text-[13px] font-bold tracking-[0.2px] uppercase" style={{ color: tone.accent }}>{tone.title}</span>
          <span className="text-[14px] font-medium text-op-text leading-[1.4] break-words">{toast.message}</span>
        </div>
        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={handleClose}
          className="bg-transparent border-0 cursor-pointer text-op-text-ter text-[18px] leading-none p-1 rounded-[6px] shrink-0"
        >
          ×
        </button>
      </div>
      <div className="h-[3px] w-full">
        <div
          className="h-full animate-toast-progress"
          style={{ background: tone.accent }}
        />
      </div>
    </div>
  );
}
