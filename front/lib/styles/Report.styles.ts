import { StyleSheet } from "react-native";
import { colors } from "../themes/Colors";
import { spacing } from "../themes/Spacing";

export default StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  avatarIcon: {
    fontSize: 28,
    color: colors.text,
  },
  menuIcon: {
    fontSize: 22,
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

  // Cards
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 17,
    textAlign: "center",
    marginBottom: spacing.md,
  },

  // Info rows (Registro section)
  infoRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  infoLabel: {
    color: colors.textLight,
    width: 120,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },

  // Triage form rows
  triageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  triageLabel: {
    color: colors.text,
    width: 112,
    fontSize: 14,
  },

  // Radio buttons (shared with MedicalRegister, duplicated for independence)
  radioRow: {
    flexDirection: "row",
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    color: colors.text,
    fontSize: 14,
  },

  // Treatment textarea
  treatmentLabel: {
    textAlign: "center",
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  treatmentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    minHeight: 80,
    color: colors.text,
    fontSize: 14,
  },

  // Patient status row
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    color: colors.text,
    fontSize: 14,
  },

  // Bottom action buttons
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.borderButton,
    borderRadius: 50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  actionButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 15,
  },

  // Dropdown
  dropdownWrapper: {
    minWidth: 120,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dropdownButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  dropdownArrow: {
    color: colors.placeholder,
    marginLeft: spacing.sm,
  },
  dropdownMenu: {
    position: "absolute",
    top: 38,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    zIndex: 10,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 14,
  },
});