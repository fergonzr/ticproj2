import { colors, emergencyColors } from "@/lib/themes/Colors";
import { styles } from "../../styles/operator/ToastNotification.styles";

export interface ToastData {
  type: "PARAMEDIC_ACCEPTED" | "EMERGENCY_RECEIVED" | "INFO";
  message: string;
}

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
}

export default function ToastNotification({ toast, onDismiss }: Props) {
  if (!toast) return null;

  const accentColor =
    toast.type === "PARAMEDIC_ACCEPTED" ? colors.primary : emergencyColors.active.border;

  return (
    <button
      style={{ ...styles.container, borderLeftColor: accentColor }}
      onClick={onDismiss}
      type="button"
    >
      <span style={styles.message}>{toast.message}</span>
    </button>
  );
}
