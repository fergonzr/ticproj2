import { ReactNode } from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";

interface Props {
  children: ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ClinicalCard({ children, padded = true, style }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: mobileColors.surface,
          borderWidth: 1,
          borderColor: mobileColors.border,
          borderRadius: mobileRadii.lg,
          padding: padded ? 16 : 0,
          shadowColor: mobileColors.text,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
