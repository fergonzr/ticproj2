import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  card: {
    background: colors.white,
    margin: `6px ${spacing.sm}px 0`,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    borderLeftWidth: 4,
    borderLeftStyle: "solid",
    borderLeftColor: colors.border,
    overflow: "hidden",
    cursor: "pointer",
    transition: "border-color 120ms ease",
    textAlign: "left",
    display: "block",
    width: `calc(100% - ${spacing.sm * 2}px)`,
    padding: 0,
    font: "inherit",
  },
  cardSelected: {
    borderColor: colors.primary,
    borderLeftColor: colors.primary,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alertLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.grey3,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  time: {
    fontSize: 11,
    color: colors.grey3,
  },
  patientRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  triageDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginRight: 6,
    flexShrink: 0,
  },
  patientName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 600,
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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
    letterSpacing: 0.5,
  },
};
