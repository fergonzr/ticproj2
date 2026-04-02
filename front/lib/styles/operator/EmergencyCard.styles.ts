import { StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 10,
    borderWidth: 2,
    padding: spacing.md,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  alertLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  time: {
    fontSize: 11,
    color: colors.grey3,
  },
  patientName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  triageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.xs,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
});
