import Card from "../components/analytics/Card";
import HeatMap from "../components/analytics/HeatMap";
import TopLocationsList from "../components/analytics/TopLocationsList";
import { useHeatmap } from "../hooks/analytics/useHeatmap";
import { useTopLocations } from "../hooks/analytics/useTopLocations";

interface Props {
  token?: string;
}

export default function HeatMapView({ token }: Props) {
  const { loading, points, error } = useHeatmap(token);
  const topLocations = useTopLocations(points);

  const hasData = points.length > 0;

  return (
    // Responsive layout:
    //  - <lg (≤1023px): one column; map on top, Top 5 below.
    //  - ≥lg: two columns side by side, map at 80% / Top at 20%.
    // `items-start` keeps the Top 5 card hugging its content instead of
    // stretching to match the taller heatmap card on wide screens.
    // The map height also scales with breakpoint so it stays usable on
    // tablets and a comfortable size on desktop.
    <div className="grid grid-cols-1 lg:grid-cols-[8fr_2fr] gap-4 lg:items-start">
      <Card
        title="Mapa de calor"
        subtitle="Zonas con más emergencias — Envigado"
        className="flex flex-col"
      >
        {loading && !hasData && (
          <div className="h-[420px] md:h-[560px] lg:h-[720px] rounded-lg bg-op-bg animate-pulse" />
        )}

        {!loading && error && (
          <div className="h-[420px] md:h-[560px] lg:h-[720px] rounded-lg bg-op-bg flex items-center justify-center text-[13px] text-op-text-ter">
            No se pudieron cargar los datos del mapa
          </div>
        )}

        {!loading && !error && !hasData && (
          <div className="h-[420px] md:h-[560px] lg:h-[720px] rounded-lg bg-op-bg flex items-center justify-center text-[13px] text-op-text-ter">
            Sin datos disponibles
          </div>
        )}

        {hasData && <HeatMap points={points} />}
      </Card>

      <Card>
        <TopLocationsList state={topLocations} />
      </Card>
    </div>
  );
}
