import { ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { mobileColors } from "@/lib/themes/mobileTokens";
import Chip from "./Chip";

interface Props {
  title: string;
  subtitle?: string;
  /** If omitted, renders a hamburger icon that opens the parent drawer. */
  leading?: ReactNode;
  trailing?: ReactNode;
  accent?: string;
}

export default function AppBar({ title, subtitle, leading, trailing, accent }: Props) {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: mobileColors.borderSoft,
        backgroundColor: mobileColors.surface,
      }}
    >
      <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
        {leading ?? (
          <TouchableOpacity
            onPress={openDrawer}
            hitSlop={8}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="menu" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: mobileColors.text,
            letterSpacing: -0.2,
            fontFamily: "Inter_700Bold",
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 12,
              color: mobileColors.textSoft,
              marginTop: 1,
              fontFamily: "Inter_400Regular",
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {accent && <Chip label={accent} tone="primary" size="sm" />}

      <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
        {trailing}
      </View>
    </View>
  );
}
