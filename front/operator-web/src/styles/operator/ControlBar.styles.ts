import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  container: {
    height: 64,
    background: colors.white,
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: `0 ${spacing.xl}px`,
    gap: spacing.md,
    flexShrink: 0,
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
    fontWeight: 500,
    marginLeft: spacing.sm,
  },
  triageBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid",
    padding: `6px ${spacing.md}px`,
    background: colors.white,
    cursor: "pointer",
  },
  triageBadgeText: {
    fontSize: 13,
    fontWeight: 600,
  },
  spacer: {
    flex: 1,
  },
};
