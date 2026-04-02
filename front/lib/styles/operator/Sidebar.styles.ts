import { StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: colors.grey0,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flexDirection: "column",
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.grey4,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
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
});
