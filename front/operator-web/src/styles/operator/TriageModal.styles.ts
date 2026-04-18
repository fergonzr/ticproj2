import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    width: 480,
    maxWidth: "90vw",
    background: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
    marginBottom: spacing.lg,
    marginTop: 0,
  },
  scroll: {
    overflowY: "auto",
    flex: 1,
  },
  questionRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: `1px solid ${colors.grey1}`,
  },
  questionText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  yesNo: {
    display: "flex",
    flexDirection: "row",
    gap: spacing.sm,
  },
  optionBtn: {
    padding: "5px 16px",
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: colors.white,
    fontSize: 13,
    color: colors.text,
    fontWeight: 500,
    cursor: "pointer",
  },
  optionSelected: {
    background: colors.primary,
    borderColor: colors.primary,
    color: colors.white,
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
};
