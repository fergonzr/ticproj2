import { StyleSheet, Dimensions } from "react-native";
import { colors } from "../themes/Colors";
import { spacing } from "../themes/Spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // Bottom sheet
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
    maxHeight: SCREEN_HEIGHT * 0.35,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetTitle: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.placeholder,
    textAlign: "center",
    fontSize: 14,
  },

  // Alert card
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  alertIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: colors.text,
  },
  alertAddress: {
    fontSize: 13,
    color: colors.textLight,
  },

  // Accept/reject row
  acceptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  acceptChevron: {
    fontSize: 18,
    color: colors.text,
    marginRight: spacing.sm,
  },
  acceptText: {
    fontSize: 14,
    color: colors.text,
  },
  rejectButton: {
    padding: spacing.sm,
  },
  rejectText: {
    fontSize: 18,
    color: colors.text,
  },

  // Active emergency panel
  activePanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  activeTitle: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  activeInfo: {
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  activeButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.md,
  },
  activeButton: {
    borderWidth: 1,
    borderColor: colors.borderButton,
    borderRadius: 50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  activeButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  // Route panel
  routeBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#6BC5C0",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.xl,
  },
  routeDirection: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeArrow: {
    fontSize: 24,
    color: colors.white,
    marginRight: spacing.md,
  },
  routeDestText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  routeBottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routeCloseButton: {
    padding: spacing.sm,
  },
  routeCloseText: {
    fontSize: 18,
    color: colors.text,
  },
  routeEta: {
    alignItems: "center",
  },
  routeEtaTime: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  routeEtaDetails: {
    fontSize: 12,
    color: colors.textLight,
  },
  arrivalButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  arrivalButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },

  // Info overlay
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
    maxHeight: SCREEN_HEIGHT * 0.55,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  infoTitle: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  infoLabel: {
    color: colors.textLight,
    width: 130,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },
  infoButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.lg,
  },
});
