import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  headerRow: {
    display: "grid",
    gridTemplateColumns: "24px 1fr 60px 50px 14px",
    padding: "6px 0",
    borderBottom: `1px solid ${U.border}`,
    gap: 6,
  },
  headerCell: {
    fontSize: 9,
    fontWeight: 700,
    color: U.textTer,
    letterSpacing: 0.5,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "24px 1fr 60px 50px 14px",
    padding: "8px 0",
    alignItems: "center",
    gap: 6,
  },
  rank: {
    fontSize: 11,
    color: U.textTer,
    fontWeight: 600,
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    minWidth: 0,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: U.primary,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 700,
    flexShrink: 0,
  },
  name: {
    fontSize: 12,
    fontWeight: 600,
    color: U.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  attendedNum: {
    fontSize: 13,
    fontWeight: 700,
    color: U.text,
  },
  miniBarTrack: {
    height: 3,
    borderRadius: 2,
    background: U.borderLight,
    marginTop: 2,
  },
  avgTime: {
    fontSize: 12,
    color: U.textSec,
  },
};
