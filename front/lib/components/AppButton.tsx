import { ReactElement } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

interface Props {
  /** Button label. */
  title: string;
  onPress?: () => void;
  /**
   * Visual style:
   * - primary  → teal solid bg + white text (confirms, saves, logins, accepts)
   * - danger   → red solid bg  + white text (deletes, rejects)
   * - outline  → transparent  + primary border + primary text (cancel, back, secondary)
   */
  variant?: "primary" | "danger" | "outline";
  disabled?: boolean;
  /** While true the button is disabled and shows loadingTitle when provided. */
  loading?: boolean;
  /** Label shown while loading. Falls back to title if omitted. */
  loadingTitle?: string;
  /** Extra styles applied to the outer TouchableOpacity (e.g. flex: 1, marginTop). */
  style?: StyleProp<ViewStyle>;
}

const containerVariant: Record<NonNullable<Props["variant"]>, object> = {
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.error },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
};

const textVariant: Record<NonNullable<Props["variant"]>, object> = {
  primary: { color: colors.white },
  danger: { color: colors.white },
  outline: { color: colors.primary },
};

/**
 * Standard action button used across all screens.
 * Centralises shape, size, typography, and colour so every button is consistent.
 */
export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  loadingTitle,
  style,
}: Props): ReactElement {
  const isDisabled = disabled || loading;
  const label = loading && loadingTitle ? loadingTitle : title;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        containerVariant[variant],
        isDisabled && styles.dimmed,
        style,
      ]}
    >
      <Text style={[styles.label, textVariant[variant]]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: spacing.xl, // 32
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  dimmed: {
    opacity: 0.5,
  },
});
