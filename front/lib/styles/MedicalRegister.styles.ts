import { StyleSheet } from "react-native";
import { colors } from "../themes/Colors";
import { spacing } from "../themes/Spacing";

export default StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.xl,
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  menuIcon: {
    fontSize: 22,
    color: colors.text,
  },

  // Outlined pill button
  pillButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    marginHorizontal: spacing.sm,
  },
  pillButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  pillButtonNeutral: {
    borderColor: colors.borderButton,
  },
  pillButtonNeutralText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  pillButtonDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  pillButtonDangerText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 15,
  },

  // Section divider button
  sectionButton: {
    marginBottom: spacing.lg,
  },

  // Form rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    justifyContent: "space-between",
  },
  rowLabel: {
    width: 112,
    color: colors.text,
    fontSize: 14,
  },
  rowInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 14,
  },
  rowControl: {
    flex: 1,
  },

  // Allergies
  allergiesLabel: {
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  checkboxRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxTick: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  checkboxLabel: {
    color: colors.text,
    fontSize: 14,
  },

  // Radio buttons
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

  // Authorization box
  authorizationBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  authorizationText: {
    textAlign: "center",
    color: colors.text,
    marginBottom: spacing.md,
    fontSize: 14,
  },
  authorizationRadios: {
    flexDirection: "row",
    justifyContent: "center",
  },

  // Dropdown
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
