import { ReactNode } from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";

interface Props {
  label: string;
  value?: string;
  placeholder?: string;
  icon?: keyof typeof Feather.glyphMap;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function FieldRow({ label, value, placeholder, icon, action, style }: Props) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: mobileColors.textMid,
          marginBottom: 6,
          fontFamily: "Inter_600SemiBold",
        }}
      >
        {label}
      </Text>
      <View
        style={{
          height: 46,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          backgroundColor: mobileColors.surface,
          borderWidth: 1,
          borderColor: mobileColors.border,
          borderRadius: mobileRadii.md,
          gap: 10,
        }}
      >
        {icon && <Feather name={icon} size={17} color={mobileColors.textSoft} />}
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            color: value ? mobileColors.text : mobileColors.textSoft,
            fontFamily: "Inter_400Regular",
          }}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        {action}
      </View>
    </View>
  );
}
