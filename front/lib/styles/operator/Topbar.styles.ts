import { StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    justifyContent: "space-between",
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  operatorName: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
