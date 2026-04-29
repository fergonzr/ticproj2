import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  root: {
    background: U.surface,
    borderRadius: 10,
    padding: 16,
    border: `1px solid ${U.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: U.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    color: U.textSec,
    fontWeight: 500,
  },
  value: {
    fontSize: 24,
    fontWeight: 700,
    color: U.text,
    letterSpacing: -0.5,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  deltaGood: {
    fontSize: 11,
    fontWeight: 700,
    color: U.success,
  },
  deltaBad: {
    fontSize: 11,
    fontWeight: 700,
    color: U.error,
  },
  avg: {
    fontSize: 11,
    color: U.textTer,
  },
};
