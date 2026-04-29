import { useMemo } from "react";
import { operatorUiColors as U, operatorStatusColors as S } from "@/lib/themes/Colors";
import type { NavIconType } from "../../components/operator/NavIcon";

export type Period = "today" | "week" | "month" | "year";
export type TrendView = "hourly" | "daily" | "monthly" | "kpis";

export interface KpiData {
  label: string;
  value: string;
  avg: string;
  /** Negative = improvement (times went down). Positive = regression. */
  delta: number;
  icon: NavIconType;
  color: string;
}

export interface PipelineStage {
  stage: string;
  time: string;
  color: string;
}

export interface TrendData {
  hourly: number[];
  daily: number[];
  monthly: number[];
  kpis: {
    triaje: number[];
    asignacion: number[];
    llegada: number[];
    total: number[];
  };
}

export interface OperatorData {
  name: string;
  attended: number;
  avgTime: string;
  active: boolean;
}

export interface ComparativeItem {
  label: string;
  current: string;
  prev: string;
  delta: string;
  /** true = change is beneficial (shown in success colour). */
  positive: boolean;
}

export interface AnalyticsData {
  kpis: KpiData[];
  pipeline: PipelineStage[];
  trends: TrendData;
  operators: OperatorData[];
  comparative: ComparativeItem[];
  /** Aggregated incident locations — no citizen-identifiable data. [lat, lng, intensity 0-1] */
  heatmapPoints: [number, number, number][];
}

// ---------------------------------------------------------------------------
// Static mock data (replace with real API calls in useAnalytics once backend
// endpoints are ready — see README for planned routes).
// ---------------------------------------------------------------------------

const MOCK_KPIS: KpiData[] = [
  { label: "Tiempo triaje",      value: "1m 24s",  avg: "1m 30s",  delta: -4,  icon: "triage",   color: S.triaged.accent  },
  { label: "Tiempo asignación",  value: "2m 10s",  avg: "2m 45s",  delta: -21, icon: "assign",   color: S.assigned.accent },
  { label: "Tiempo llegada",     value: "8m 32s",  avg: "9m 00s",  delta: -5,  icon: "location", color: S.onSite.accent   },
  { label: "Tiempo total",       value: "18m 45s", avg: "22m 10s", delta: -15, icon: "history",  color: U.primary         },
  { label: "Promedio en cola",   value: "45s",     avg: "1m 02s",  delta: -27, icon: "alerts",   color: S.received.accent },
];

const MOCK_PIPELINE: PipelineStage[] = [
  { stage: "Recibida",          time: "10s", color: S.received.accent },
  { stage: "Pend. asignación",  time: "40s", color: S.triaged.accent  },
  { stage: "Transfer. a sitio", time: "2m",  color: S.assigned.accent },
  { stage: "En sitio",          time: "3m",  color: S.onSite.accent   },
  { stage: "Transfer. centro",  time: "3m",  color: S.closed.accent   },
];

const MOCK_TRENDS: TrendData = {
  hourly:  [3,5,2,1,0,1,4,8,14,18,22,19,15,12,16,20,24,18,14,10,7,5,4,2],
  daily:   [42,38,55,61,48,35,29],
  monthly: [320,290,340,380,410,365,398,420,445,390,370,350],
  kpis: {
    triaje:     [95,88,84,82,80,84,78,85,82,80,84,78],
    asignacion: [180,165,150,140,135,130,128,132,126,130,128,125],
    llegada:    [560,540,520,510,515,505,512,508,500,510,505,498],
    total:      [1200,1180,1150,1130,1120,1125,1110,1100,1115,1105,1095,1080],
  },
};

const MOCK_OPERATORS: OperatorData[] = [
  { name: "Juan Martínez",   attended: 145, avgTime: "16m", active: true  },
  { name: "Laura Gómez",     attended: 132, avgTime: "18m", active: true  },
  { name: "Carlos Restrepo", attended: 128, avgTime: "15m", active: false },
  { name: "Ana Pérez",       attended: 118, avgTime: "20m", active: true  },
  { name: "Pedro López",     attended:  95, avgTime: "22m", active: false },
];

const MOCK_COMPARATIVE: ComparativeItem[] = [
  { label: "Total emergencias", current: "147",      prev: "131",      delta: "+12%", positive: true  },
  { label: "Tiempo respuesta",  current: "18m 45s",  prev: "22m 10s",  delta: "-15%", positive: true  },
  { label: "Casos críticos",    current: "32",        prev: "28",        delta: "+14%", positive: false },
];

const MOCK_HEATMAP: [number, number, number][] = [
  [6.1710,-75.5890,0.8],[6.1680,-75.5920,0.6],[6.1650,-75.5840,0.9],[6.1730,-75.5870,0.4],
  [6.1695,-75.5950,0.7],[6.1720,-75.5860,0.5],[6.1700,-75.5900,1.0],[6.1660,-75.5880,0.3],
  [6.1740,-75.5910,0.6],[6.1685,-75.5850,0.8],[6.1715,-75.5930,0.5],[6.1670,-75.5870,0.7],
  [6.1705,-75.5845,0.9],[6.1690,-75.5915,0.4],[6.1725,-75.5880,0.6],[6.1665,-75.5900,0.3],
  [6.1735,-75.5855,0.7],[6.1675,-75.5935,0.5],[6.1710,-75.5870,0.8],[6.1698,-75.5862,0.6],
  [6.1755,-75.5895,0.5],[6.1645,-75.5905,0.4],[6.1720,-75.5945,0.6],[6.1690,-75.5835,0.7],
];

/**
 * Returns analytics data for the given period.
 *
 * TODO: replace mock return with real API calls:
 *   GET /api/v1/analytics/kpis?period={period}
 *   GET /api/v1/analytics/pipeline?period={period}
 *   GET /api/v1/analytics/trends?type={view}&period={period}
 *   GET /api/v1/analytics/heatmap?period={period}
 *   GET /api/v1/analytics/operators?period={period}
 *   GET /api/v1/analytics/comparative?period={period}
 *   POST /api/v1/analytics/export?format={pdf|csv}&period={period}
 */
export function useAnalytics(_period: Period): AnalyticsData {
  return useMemo<AnalyticsData>(
    () => ({
      kpis:           MOCK_KPIS,
      pipeline:       MOCK_PIPELINE,
      trends:         MOCK_TRENDS,
      operators:      MOCK_OPERATORS,
      comparative:    MOCK_COMPARATIVE,
      heatmapPoints:  MOCK_HEATMAP,
    }),
    [],
  );
}
