import { ReactNode } from "react";
import { Text, StyleProp, TextStyle } from "react-native";
import { mobileColors } from "@/lib/themes/mobileTokens";

interface Props {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

export default function SectionLabel({ children, style }: Props) {
  return (
    <Text
      style={[
        {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: mobileColors.textSoft,
          marginBottom: 8,
          fontFamily: "Inter_700Bold",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
