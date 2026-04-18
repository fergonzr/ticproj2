import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

export const styles: Record<string, CSSProperties> = {
  container: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    background: colors.white,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftStyle: "solid",
    padding: `${spacing.sm}px ${spacing.md}px ${spacing.sm}px ${spacing.md}px`,
    boxShadow: "0 2px 8px rgba(35,42,50,0.12)",
    maxWidth: 320,
    zIndex: 200,
    cursor: "pointer",
    border: "none",
    textAlign: "left",
  },
  message: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 500,
    paddingLeft: spacing.xs,
  },
};
