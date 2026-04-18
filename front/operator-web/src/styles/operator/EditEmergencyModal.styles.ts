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
    width: 440,
    maxWidth: "90vw",
    background: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
    marginBottom: spacing.lg,
    marginTop: 0,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: colors.grey5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  input: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.md,
    background: colors.white,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
};
