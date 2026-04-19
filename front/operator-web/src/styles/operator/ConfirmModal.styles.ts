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
    background: U.surface,
    borderRadius: 14,
    padding: 28,
    width: 400,
    boxShadow: "0 20px 60px rgba(0,0,0,.2)",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: U.text,
    margin: 0,
    marginBottom: 16,
  },
  summary: {
    background: U.bg,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  patientName: {
    fontSize: 13,
    fontWeight: 600,
    color: U.text,
  },
  statusBadge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    fontWeight: 600,
  },
  infoList: {
    fontSize: 13,
    color: U.textSec,
    lineHeight: 1.8,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  note: {
    fontSize: 12,
    color: U.textTer,
    marginBottom: 20,
    lineHeight: 1.5,
  },
  footer: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
};
