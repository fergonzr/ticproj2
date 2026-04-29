import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    minHeight: 560,
    borderRadius: 8,
    overflow: "hidden",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
  },
};
