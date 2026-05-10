import { ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { mobileColors } from "@/lib/themes/mobileTokens";

export type PillVariant = "primary" | "danger" | "outline" | "ghost" | "dark";
export type PillSize = "sm" | "md" | "lg";

const variants: Record<PillVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: mobileColors.primary,     fg: "#fff",                   border: "transparent" },
  danger:  { bg: mobileColors.critical,    fg: "#fff",                   border: "transparent" },
  outline: { bg: "#fff",                   fg: mobileColors.primary,     border: mobileColors.primary },
  ghost:   { bg: mobileColors.primarySoft, fg: mobileColors.primaryDeep, border: "transparent" },
  dark:    { bg: mobileColors.text,         fg: "#fff",                   border: "transparent" },
};

const heights: Record<PillSize, number> = { sm: 38, md: 48, lg: 56 };
const fontSizes: Record<PillSize, number> = { sm: 13, md: 15, lg: 17 };

interface Props {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  variant?: PillVariant;
  size?: PillSize;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export default function PillButton({
  label,
  icon,
  variant = "primary",
  size = "md",
  full,
  disabled,
  loading,
  onPress,
  style,
}: Props) {
  const v = variants[variant];
  const isDisabled = disabled || loading;
  const iconSize = size === "lg" ? 20 : 17;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        {
          height: heights[size],
          paddingHorizontal: 22,
          borderRadius: 999,
          backgroundColor: v.bg,
          borderWidth: v.border === "transparent" ? 0 : 1.5,
          borderColor: v.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: full ? "100%" : undefined,
          opacity: isDisabled ? 0.5 : 1,
          ...(variant === "primary"
            ? {
                shadowColor: mobileColors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 4,
              }
            : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon && <Feather name={icon} size={iconSize} color={v.fg} />}
          <Text
            style={{
              fontSize: fontSizes[size],
              fontWeight: "600",
              color: v.fg,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
