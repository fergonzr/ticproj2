import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  container: {
    width: 300,
    background: colors.grey0,
    borderRight: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: `10px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    background: colors.white,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.grey4,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    margin: 0,
  },
  list: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    color: colors.grey3,
    marginTop: spacing.xl,
    fontSize: 13,
  },
  backBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: `10px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    background: colors.white,
    gap: spacing.sm,
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "left",
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 700,
  },
  backLabel: {
    color: colors.grey4,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
};
