import { View, Text, StyleProp, ViewStyle } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { mobileColors } from "@/lib/themes/mobileTokens";

export type ChipTone =
  | "primary"
  | "critical"
  | "urgent"
  | "mild"
  | "info"
  | "neutral"
  | "dark";

export type ChipSize = "sm" | "md";

const tones: Record<ChipTone, { bg: string; fg: string }> = {
  primary:  { bg: mobileColors.primarySoft, fg: mobileColors.primaryDeep },
  critical: { bg: mobileColors.criticalBg,  fg: mobileColors.critical },
  urgent:   { bg: mobileColors.urgentBg,    fg: mobileColors.urgent },
  mild:     { bg: mobileColors.mildBg,      fg: mobileColors.mild },
  info:     { bg: mobileColors.blueBg,      fg: mobileColors.blue },
  neutral:  { bg: "#F1F3F5",               fg: mobileColors.textMid },
  dark:     { bg: mobileColors.text,        fg: "#fff" },
};

interface Props {
  label: string;
  tone?: ChipTone;
  icon?: keyof typeof Feather.glyphMap;
  size?: ChipSize;
  style?: StyleProp<ViewStyle>;
}

export default function Chip({ label, tone = "primary", icon, size = "sm", style }: Props) {
  const t = tones[tone];
  const small = size === "sm";

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: small ? 10 : 12,
          paddingVertical: small ? 4 : 6,
          backgroundColor: t.bg,
          borderRadius: 999,
        },
        style,
      ]}
    >
      {icon && (
        <Feather name={icon} size={small ? 12 : 14} color={t.fg} />
      )}
      <Text
        style={{
          fontSize: small ? 11 : 13,
          fontWeight: "700",
          color: t.fg,
          letterSpacing: 0.2,
          fontFamily: "Inter_700Bold",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
