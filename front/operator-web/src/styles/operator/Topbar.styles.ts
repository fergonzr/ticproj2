import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  container: {
    height: 56,
    background: colors.primary,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: `0 ${spacing.xl}px`,
    justifyContent: "space-between",
    flexShrink: 0,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  statusRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusChip: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 6,
    background: "rgba(255,255,255,0.15)",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusChipText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: 500,
  },
  statusCount: {
    color: colors.white,
    fontWeight: 700,
  },
  right: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  operatorName: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: 500,
  },
  logoutBtn: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.5)",
    background: "transparent",
    color: colors.white,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
};
