import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  root: {
    background: U.surface,
    borderRadius: 10,
    border: `1px solid ${U.border}`,
    padding: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: 700,
    color: U.text,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: 500,
    color: U.textTer,
  },
};
