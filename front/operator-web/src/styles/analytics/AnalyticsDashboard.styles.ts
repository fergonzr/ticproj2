import type { CSSProperties } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";

export const styles: Record<string, CSSProperties> = {
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
    background: U.bg,
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: 20,
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    marginBottom: 16,
  },
  pipelineCard: {
    marginBottom: 16,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 16,
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  heatmapCard: {
    display: "flex",
    flexDirection: "column",
  },
};
