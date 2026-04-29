import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  totalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 11,
    color: U.textTer,
    letterSpacing: 0.6,
    fontWeight: 600,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: 700,
    color: U.text,
    letterSpacing: -0.5,
  },
  bar: {
    display: "flex",
    height: 32,
    borderRadius: 7,
    overflow: "hidden",
    border: `1px solid ${U.border}`,
  },
  legend: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 8,
    marginTop: 12,
  },
  legendItem: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  legendHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  legendLabel: {
    fontSize: 10,
    color: U.textTer,
    lineHeight: "1.1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  legendTime: {
    fontSize: 13,
    fontWeight: 700,
    color: U.text,
    paddingLeft: 15,
  },
  stdDevFooter: {
    marginTop: 12,
    padding: "8px 12px",
    background: U.bg,
    borderRadius: 7,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stdDevLabel: {
    fontSize: 11,
    color: U.textSec,
  },
  stdDevValue: {
    fontSize: 12,
    fontWeight: 700,
    color: U.text,
  },
};
