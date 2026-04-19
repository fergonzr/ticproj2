import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    background: U.bg,
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
    position: "relative",
  },
  mapArea: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  errorBanner: {
    padding: "8px 20px",
    background: "#fed7d7",
    color: U.error,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
  },
  dismissBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    color: U.error,
    lineHeight: 1,
  },
};
