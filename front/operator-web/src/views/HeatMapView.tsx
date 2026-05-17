import Card from "../components/analytics/Card";
import HeatMap from "../components/analytics/HeatMap";
import TopLocationsList from "../components/analytics/TopLocationsList";
import { useTopLocations } from "../hooks/analytics/useTopLocations";

interface Props {
  points: [number, number, number][];
}

export default function HeatMapView({ points }: Props) {
  const topLocations = useTopLocations(points);

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Mapa de calor"
        subtitle="Zonas con más emergencias — Envigado"
        className="flex flex-col"
      >
        <HeatMap points={points} />
      </Card>
      <Card>
        <TopLocationsList state={topLocations} />
      </Card>
    </div>
  );
}
