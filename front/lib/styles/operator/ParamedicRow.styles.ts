import { StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  distance: {
    fontSize: 12,
    color: colors.grey4,
    marginTop: 2,
  },
  assignBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  assignBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
