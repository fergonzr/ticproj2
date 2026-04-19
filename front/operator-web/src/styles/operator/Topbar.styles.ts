import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  container: {
    height: 48,
    background: U.surface,
    borderBottom: `1px solid ${U.border}`,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: U.text,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  statusChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  statusText: {
    fontSize: 12,
    color: U.textSec,
  },
  divider: {
    width: 1,
    height: 20,
    background: U.border,
  },
  operatorName: {
    fontSize: 13,
    fontWeight: 600,
    color: U.textSec,
  },
};
