import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  container: {
    width: 56,
    background: U.navBg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "14px 0",
    gap: 4,
    flexShrink: 0,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: U.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  spacer: { flex: 1 },
};

export const badgeStyle: CSSProperties = {
  position: "absolute",
  top: 2,
  right: 2,
  minWidth: 16,
  height: 16,
  padding: "0 4px",
  borderRadius: 8,
  background: U.error,
  color: "#fff",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: "16px",
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  pointerEvents: "none",
};

export function navBtnStyle(active: boolean, variant: "default" | "logout" = "default"): CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: 8,
    border: "none",
    background: active ? U.navActive : "transparent",
    color: variant === "logout" ? U.error : active ? "#fff" : U.navIconIdle,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all .15s",
    padding: 0,
  };
}
