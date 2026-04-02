import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ToastData } from "@/lib/models";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
}

export default function ToastNotification({ toast, onDismiss }: Props) {
  if (!toast) return null;

  const accentColor =
    toast.type === "PARAMEDIC_ACCEPTED" ? colors.primary : "#185fa5";

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

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderLeftWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 320,
    zIndex: 200,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    paddingLeft: spacing.xs,
  },
});
