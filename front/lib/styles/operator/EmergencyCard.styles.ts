import { StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.sm,
    marginTop: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: colors.primary,
    borderLeftColor: colors.primary,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alertLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.grey3,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  time: {
    fontSize: 11,
    color: colors.grey3,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  triageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  patientName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
    flex: 1,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});