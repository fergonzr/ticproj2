import { useState } from "react";
import { useAnalytics, type Period } from "../hooks/analytics/useAnalytics";

import AnalyticsTopBar    from "../components/analytics/AnalyticsTopBar";
import Card               from "../components/analytics/Card";
import KpiCard            from "../components/analytics/KpiCard";
import StackedPipelineBar from "../components/analytics/StackedPipelineBar";
import TrendChart         from "../components/analytics/TrendChart";
import OperatorsTable     from "../components/analytics/OperatorsTable";
import ComparativeCard    from "../components/analytics/ComparativeCard";
import HeatMap            from "../components/analytics/HeatMap";

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const data = useAnalytics(period);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-op-bg">
      <AnalyticsTopBar period={period} onPeriodChange={setPeriod} />

      <div className="flex-1 overflow-y-auto p-5">
        {/* KPI row */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {data.kpis.map((k, i) => (
            <KpiCard key={i} kpi={k} />
          ))}
        </div>

        {/* Pipeline full-width card */}
        <Card
          title="Emergencias completadas"
          subtitle={`147 este ${period === "today" ? "día" : period === "week" ? "semana" : period === "year" ? "año" : "mes"}`}
          className="mb-4"
        >
          <StackedPipelineBar stages={data.pipeline} />
        </Card>

        {/* Bottom: left column 420px + heatmap flex-1 */}
        <div className="grid [grid-template-columns:420px_1fr] gap-4">
          <div className="flex flex-col gap-4">
            <Card title="Tendencia de emergencias">
              <TrendChart trends={data.trends} />
            </Card>

            <Card
              title="Ciudadanos atendidos por operador"
              subtitle={`${data.operators.length} operadores`}
            >
              <OperatorsTable operators={data.operators} />
            </Card>

            <ComparativeCard items={data.comparative} />
          </div>

          <Card
            title="Mapa de calor"
            subtitle="Zonas con más emergencias — Envigado"
            className="flex flex-col"
          >
            <HeatMap points={data.heatmapPoints} />
          </Card>
        </div>
      </div>
    </div>
  );
}
