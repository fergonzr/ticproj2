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
    <div className="flex flex-col gap-4">
      <Card
        title="Mapa de calor"
        subtitle="Zonas con más emergencias — Envigado"
        className="flex flex-col"
      >
        {loading && !hasData && (
          <div className="h-[560px] rounded-lg bg-op-bg animate-pulse" />
        )}

        {!loading && error && (
          <div className="h-[560px] rounded-lg bg-op-bg flex items-center justify-center text-[13px] text-op-text-ter">
            No se pudieron cargar los datos del mapa
          </div>
        )}

        {!loading && !error && !hasData && (
          <div className="h-[560px] rounded-lg bg-op-bg flex items-center justify-center text-[13px] text-op-text-ter">
            Sin datos disponibles
          </div>
        )}

        {hasData && <HeatMap points={points} />}
      </Card>

      {hasData && (
        <Card>
          <TopLocationsList state={topLocations} />
        </Card>
      )}
    </div>
  );
}
