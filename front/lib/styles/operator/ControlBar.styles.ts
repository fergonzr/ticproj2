import { StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.grey4,
    fontSize: 13,
    fontStyle: "italic",
    flex: 1,
    textAlign: "center",
  },
  enRouteText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: spacing.sm,
  },
  triageBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  triageBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
  },
});
