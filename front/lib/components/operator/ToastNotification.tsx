import { View, Text, TouchableOpacity } from "react-native";
import { ToastData } from "@/lib/models";
import { colors, emergencyColors } from "@/lib/themes/Colors";
import { styles } from "@/lib/styles/operator/ToastNotification.styles";

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
}

export default function ToastNotification({ toast, onDismiss }: Props) {
  if (!toast) return null;

  const accentColor =
    toast.type === "PARAMEDIC_ACCEPTED" ? colors.primary : emergencyColors.active.border;

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: accentColor }]}
      onPress={onDismiss}
      activeOpacity={0.85}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text style={styles.message}>{toast.message}</Text>
    </TouchableOpacity>
  );
}
