import { useState } from "react";
import { useAnalytics, type Period } from "../hooks/analytics/useAnalytics";
import { styles } from "../styles/analytics/AnalyticsDashboard.styles";

import AnalyticsTopBar from "../components/analytics/AnalyticsTopBar";
import Card            from "../components/analytics/Card";
import KpiCard         from "../components/analytics/KpiCard";
import StackedPipelineBar from "../components/analytics/StackedPipelineBar";
import TrendChart      from "../components/analytics/TrendChart";
import OperatorsTable  from "../components/analytics/OperatorsTable";
import ComparativeCard from "../components/analytics/ComparativeCard";
import HeatMap         from "../components/analytics/HeatMap";

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const data = useAnalytics(period);

  return (
    <div style={styles.root}>
      <AnalyticsTopBar period={period} onPeriodChange={setPeriod} />

      <div style={styles.scrollArea}>
        {/* KPI row */}
        <div style={styles.kpiRow}>
          {data.kpis.map((k, i) => (
            <KpiCard key={i} kpi={k} />
          ))}
        </div>

        {/* Pipeline full-width card */}
        <Card
          title="Emergencias completadas"
          subtitle={`147 este ${period === "today" ? "día" : period === "week" ? "semana" : period === "year" ? "año" : "mes"}`}
          style={styles.pipelineCard}
        >
          <StackedPipelineBar stages={data.pipeline} />
        </Card>

        {/* Bottom: left column 420px + heatmap flex-1 */}
        <div style={styles.bottomGrid}>
          <div style={styles.leftColumn}>
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
            style={styles.heatmapCard}
          >
            <HeatMap points={data.heatmapPoints} />
          </Card>
        </div>
      </div>
    </div>
  );
}
