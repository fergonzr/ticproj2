import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(2px)",
  },
  modal: {
    width: 460,
    maxWidth: "92vw",
    background: U.surface,
    borderRadius: 14,
    padding: 28,
    maxHeight: "80%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: U.text,
    margin: 0,
    marginBottom: 20,
  },
  scroll: {
    flex: 1,
    overflowY: "auto",
    marginBottom: 20,
  },
  questionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${U.borderLight}`,
  },
  questionText: {
    fontSize: 13,
    color: U.text,
    flex: 1,
    marginRight: 12,
  },
  yesNo: {
    display: "flex",
    gap: 4,
  },
  optionBtn: {
    padding: "4px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: `1.5px solid ${U.border}`,
    background: U.surface,
    color: U.textSec,
    fontFamily: "inherit",
  },
  optionYesSelected: {
    border: `1.5px solid ${U.error}`,
    background: "#fef2f2",
    color: U.error,
  },
  optionNoSelected: {
    border: `1.5px solid ${U.success}`,
    background: "#f0fdf4",
    color: U.success,
  },
  preview: {
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: 700,
  },
  previewLevel: {
    fontSize: 11,
    opacity: 0.7,
  },
  footer: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
};
