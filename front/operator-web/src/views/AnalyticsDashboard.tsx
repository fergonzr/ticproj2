import { useState } from "react";
import { useAnalytics, type Period } from "../hooks/analytics/useAnalytics";
import AnalyticsTopBar, { type AnalyticsView } from "../components/analytics/AnalyticsTopBar";
import HistoryView from "./HistoryView";
import HeatMapView from "./HeatMapView";
import Card               from "../components/analytics/Card";
import KpiCard            from "../components/analytics/KpiCard";
import StackedPipelineBar from "../components/analytics/StackedPipelineBar";
import TrendChart         from "../components/analytics/TrendChart";
import OperatorsTable     from "../components/analytics/OperatorsTable";
import ComparativeCard    from "../components/analytics/ComparativeCard";

interface Props {
  token?: string;
}

export default function AnalyticsDashboard({ token }: Props) {
  const [view,            setView]            = useState<AnalyticsView>("analytics");
  const [analyticsPeriod, setAnalyticsPeriod] = useState<Period>("month");
  const [historyPeriod,   setHistoryPeriod]   = useState<Period>("month");
  const { loading, data, error } = useAnalytics(analyticsPeriod, token);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-op-bg">
      <AnalyticsTopBar
        view={view}
        onViewChange={setView}
        analyticsPeriod={analyticsPeriod}
        onAnalyticsPeriodChange={setAnalyticsPeriod}
        historyPeriod={historyPeriod}
        onHistoryPeriodChange={setHistoryPeriod}
      />

      <div className="flex-1 overflow-y-auto p-5">
        {view === "history" ? (
          <HistoryView period={historyPeriod} token={token} />
        ) : view === "heatmap" ? (
          <HeatMapView token={token} />
        ) : loading && !data ? (
          <div className="h-[560px] rounded-[10px] bg-op-surface border border-op-border animate-pulse" />
        ) : error && !data ? (
          <div className="h-[560px] rounded-[10px] bg-op-surface border border-op-border flex items-center justify-center text-[13px] text-op-text-ter">
            No se pudieron cargar los datos de analítica
          </div>
        ) : !data ? (
          <div className="h-[560px] rounded-[10px] bg-op-surface border border-op-border flex items-center justify-center text-[13px] text-op-text-ter">
            Sin datos disponibles
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              {data.kpis.map((k, i) => (
                <KpiCard key={i} kpi={k} />
              ))}
            </div>

            {/* Pipeline full-width card */}
            <Card
              title="Emergencias completadas"
              subtitle={`${data.emergencyCount} este ${analyticsPeriod === "today" ? "día" : analyticsPeriod === "week" ? "semana" : analyticsPeriod === "year" ? "año" : "mes"}`}
              className="mb-4"
            >
              <StackedPipelineBar stages={data.pipeline} stdev={data.stdev} />
            </Card>

            {/* 3 equal columns: trend / operators / comparative */}
            <div className="grid grid-cols-3 gap-4">
              <Card title="Tendencia de emergencias">
                <TrendChart trend={data.trend} />
              </Card>

              <Card
                title="Ciudadanos atendidos por operador"
                subtitle={`${data.operators.length} operadores`}
              >
                <OperatorsTable operators={data.operators} />
              </Card>

              <ComparativeCard items={data.comparative} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
