import Card from "../components/analytics/Card";
import HeatMap from "../components/analytics/HeatMap";

interface Props {
  points: [number, number, number][];
}

export default function HeatMapView({ points }: Props) {
  return (
    <Card
      title="Mapa de calor"
      subtitle="Zonas con más emergencias — Envigado"
      className="flex flex-col h-full"
    >
      <HeatMap points={points} />
    </Card>
  );
}
