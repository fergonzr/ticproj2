import { useMemo } from "react";
import { buildHeatmapHtml } from "../../map/heatmapLeafletHtml";
import { styles } from "../../styles/analytics/HeatMap.styles";

interface Props {
  points: [number, number, number][];
}

export default function HeatMap({ points }: Props) {
  const srcDoc = useMemo(() => buildHeatmapHtml(points), [points]);

  return (
    <div style={styles.container}>
      <iframe
        srcDoc={srcDoc}
        style={styles.iframe}
        title="Mapa de calor de emergencias — Envigado"
        sandbox="allow-scripts"
      />
    </div>
  );
}
