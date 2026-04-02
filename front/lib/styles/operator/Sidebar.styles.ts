import { StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles = StyleSheet.create({
  container: {
    width: 300,
    backgroundColor: colors.grey0,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flexDirection: "column",
  },
  sidebarHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.grey4,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  list: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: colors.grey3,
    marginTop: spacing.xl,
    fontSize: 13,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.grey4,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  backBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  backLabel: {
    color: colors.grey4,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});