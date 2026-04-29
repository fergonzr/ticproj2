import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  item: {
    padding: "8px 10px",
    background: U.bg,
    borderRadius: 7,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    color: U.textSec,
    marginBottom: 2,
  },
  values: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  current: {
    fontSize: 15,
    fontWeight: 700,
    color: U.text,
  },
  prev: {
    fontSize: 10,
    color: U.textTer,
  },
  deltaGood: {
    fontSize: 12,
    fontWeight: 700,
    color: U.success,
  },
  deltaBad: {
    fontSize: 12,
    fontWeight: 700,
    color: U.error,
  },
};
