import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    background: colors.white,
    margin: `6px ${spacing.sm}px 0`,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    padding: spacing.md,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: colors.secondary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    flexShrink: 0,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 2,
  },
  distance: {
    fontSize: 11,
    color: colors.grey4,
    marginBottom: 5,
  },
  statusBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
  },
  statusText: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  assignBtn: {
    padding: "7px 14px",
    borderRadius: 6,
    background: colors.primary,
    color: colors.white,
    fontSize: 12,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
};
