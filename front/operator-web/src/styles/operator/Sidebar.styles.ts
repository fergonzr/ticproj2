import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  container: {
    width: 340,
    borderRight: `1px solid ${U.border}`,
    background: U.surface,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  header: {
    padding: "14px 16px",
    borderBottom: `1px solid ${U.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: U.text,
    margin: 0,
  },
  count: {
    fontSize: 12,
    color: U.textTer,
    fontWeight: 600,
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "6px 10px",
  },
  emptyText: {
    textAlign: "center",
    color: U.textTer,
    marginTop: 32,
    fontSize: 13,
  },
};
