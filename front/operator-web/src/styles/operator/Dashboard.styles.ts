import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: colors.background,
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    minHeight: 0,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  mapArea: {
    flex: 1,
    position: "relative",
    background: colors.grey1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mapPlaceholder: {
    color: colors.grey4,
    fontSize: 14,
    fontStyle: "italic",
  },
  errorBanner: {
    padding: `${spacing.sm}px ${spacing.xl}px`,
    background: "#fed7d7",
    color: colors.error,
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    fontSize: 13,
  },
  dismissBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    color: colors.error,
    lineHeight: 1,
  },
};
