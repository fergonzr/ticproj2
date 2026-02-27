import { Stack } from "expo-router";
import { ReactElement } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

/**
 * Header shared across all paramedic screens.
 * Displays a user avatar icon and a "Paramedico" role pill.
 */
function ParamedicHeader(): ReactElement {
  return (
    <View style={styles.header}>
      <TouchableOpacity>
        <Text style={styles.avatarIcon}>👤</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.pillButton}>
        <Text style={styles.pillButtonText}>Paramedico</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Simple Stack (push-pop navigation) layout to group the paramedic screens.
 * @returns
 */
export default function ParamedicLayout(): ReactElement {
  return (
    <Stack
      screenOptions={{
        header: () => <ParamedicHeader />,
      }}
      initialRouteName="LoginScreen"
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  avatarIcon: {
    fontSize: 28,
    color: colors.text,
  },
  pillButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  pillButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
});