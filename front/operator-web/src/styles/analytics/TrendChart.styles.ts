import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  tabsRow: {
    display: "flex",
    gap: 4,
    marginBottom: 10,
  },
  chartWrap: {
    minHeight: 130,
  },
  footer: {
    marginTop: 8,
    display: "flex",
    gap: 16,
  },
  footerItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  footerLabel: {
    fontSize: 10,
    color: U.textTer,
  },
  footerValue: {
    fontSize: 11,
    fontWeight: 700,
    color: U.text,
  },
  kpiRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: U.textSec,
    width: 65,
    textAlign: "right",
    flexShrink: 0,
  },
};

export function tabBtnStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 5,
    border: `1px solid ${active ? U.primary : U.border}`,
    background: active ? U.primaryLight : U.surface,
    color: active ? U.primary : U.textSec,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
  };
}
