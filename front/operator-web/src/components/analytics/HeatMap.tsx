import { useMemo } from "react";
import { buildHeatmapHtml } from "../../map/heatmapLeafletHtml";

interface Props {
  points: [number, number, number][];
}

export default function HeatMap({ points }: Props) {
  const srcDoc = useMemo(() => buildHeatmapHtml(points), [points]);

  return (
    <div className="h-[560px] rounded-lg overflow-hidden">
      <iframe
        srcDoc={srcDoc}
        className="w-full h-full block border-0"
        title="Mapa de calor de emergencias — Envigado"
        sandbox="allow-scripts"
      />
    </div>
  );
}
