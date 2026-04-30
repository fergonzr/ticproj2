import { useEffect, type MouseEvent } from "react";
import { operatorToastTones as T } from "@/lib/themes/Colors";
import {
  styles,
  TOAST_KEYFRAMES,
  TOAST_ANIMATION_ID,
} from "../../styles/operator/ToastNotification.styles";

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
    if (typeof document === "undefined") return;
    const existing = document.getElementById("operator-toast-keyframes");
    if (existing) return;
    const style = document.createElement("style");
    style.id = "operator-toast-keyframes";
    style.textContent = TOAST_KEYFRAMES;
    document.head.appendChild(style);
  }, []);

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
      style={{ ...styles.container }}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <div style={styles.body}>
        <span style={{ ...styles.iconWrap, background: tone.iconBg }}>
          <ToastIcon name={tone.icon} color={tone.iconColor} />
        </span>
        <div style={styles.textColumn}>
          <span style={{ ...styles.title, color: tone.accent }}>{tone.title}</span>
          <span style={styles.message}>{toast.message}</span>
        </div>
        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={handleClose}
          style={styles.closeBtn}
        >
          ×
        </button>
      </div>
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            background: tone.accent,
            // restart the progress animation when the toast content changes
            animationName: `${TOAST_ANIMATION_ID}-progress`,
          }}
        />
      </div>
    </div>
  );
}
