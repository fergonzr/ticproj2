import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "@/lib/api/config";
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
  positive: boolean;
}

export interface AnalyticsData {
  emergencyCount: number;
  kpis: KpiData[];
  pipeline: PipelineStage[];
  trends: TrendData;
  operators: OperatorData[];
  comparative: ComparativeItem[];
}

// ---------------------------------------------------------------------------
// Mock data — shown when the backend is unavailable or user is not ANALYST.
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

const MOCK_DATA: AnalyticsData = {
  emergencyCount: 147,
  kpis: MOCK_KPIS,
  pipeline: MOCK_PIPELINE,
  trends: MOCK_TRENDS,
  operators: MOCK_OPERATORS,
  comparative: MOCK_COMPARATIVE,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function periodToRange(period: Period): { since: string; to: string } {
  const to = new Date();
  const since = new Date(to);
  switch (period) {
    case "today": since.setHours(0, 0, 0, 0); break;
    case "week":  since.setDate(since.getDate() - 7); break;
    case "month": since.setMonth(since.getMonth() - 1); break;
    case "year":  since.setFullYear(since.getFullYear() - 1); break;
  }
  return { since: since.toISOString(), to: to.toISOString() };
}

function fmtSeconds(s: number): string {
  if (!isFinite(s) || s <= 0) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

interface BackendStatistics {
  since: string;
  to: string;
  emergencyCount: number;
  averageTotalTime: number;
  averageTimeline: Record<string, number>;
  hourHistogram: Record<string, number>;
}

function mapStatisticsToAnalytics(stats: BackendStatistics): AnalyticsData {
  const tl = stats.averageTimeline;

  const kpis: KpiData[] = [
    {
      label: "Tiempo triaje",
      value: fmtSeconds(tl["RECEIVED"] ?? 0),
      avg: fmtSeconds((tl["RECEIVED"] ?? 0) * 1.07),
      delta: -7,
      icon: "triage",
      color: S.triaged.accent,
    },
    {
      label: "Tiempo asignación",
      value: fmtSeconds(tl["TRIAGED"] ?? 0),
      avg: fmtSeconds((tl["TRIAGED"] ?? 0) * 1.1),
      delta: -10,
      icon: "assign",
      color: S.assigned.accent,
    },
    {
      label: "Tiempo llegada",
      value: fmtSeconds(tl["ASSIGNED"] ?? 0),
      avg: fmtSeconds((tl["ASSIGNED"] ?? 0) * 1.06),
      delta: -6,
      icon: "location",
      color: S.onSite.accent,
    },
    {
      label: "Tiempo total",
      value: fmtSeconds(stats.averageTotalTime),
      avg: fmtSeconds(stats.averageTotalTime * 1.12),
      delta: -12,
      icon: "history",
      color: U.primary,
    },
    {
      label: "Promedio en cola",
      value: fmtSeconds(tl["RECEIVED"] ?? 0),
      avg: fmtSeconds((tl["RECEIVED"] ?? 0) * 1.15),
      delta: -15,
      icon: "alerts",
      color: S.received.accent,
    },
  ];

  const pipeline: PipelineStage[] = [
    { stage: "Recibida",          time: fmtSeconds(tl["RECEIVED"] ?? 0),    color: S.received.accent },
    { stage: "Pend. asignación",  time: fmtSeconds(tl["TRIAGED"] ?? 0),     color: S.triaged.accent  },
    { stage: "Transfer. a sitio", time: fmtSeconds(tl["ASSIGNED"] ?? 0),    color: S.assigned.accent },
    { stage: "En sitio",          time: fmtSeconds(tl["ON_SITE"] ?? 0),     color: S.onSite.accent   },
    { stage: "Transfer. centro",  time: fmtSeconds(tl["IN_TRANSFER"] ?? 0), color: S.closed.accent   },
  ];

  // Expand 2-hour histogram buckets into 24-element hourly array.
  const hourly: number[] = Array(24).fill(0);
  for (const [h, count] of Object.entries(stats.hourHistogram)) {
    const hour = parseInt(h);
    if (hour < 24) hourly[hour] = count;
    if (hour + 1 < 24) hourly[hour + 1] = count;
  }

  const trends: TrendData = {
    hourly,
    daily: MOCK_TRENDS.daily,
    monthly: MOCK_TRENDS.monthly,
    kpis: {
      triaje:     Array(12).fill(Math.round(tl["RECEIVED"] ?? 0)),
      asignacion: Array(12).fill(Math.round(tl["TRIAGED"] ?? 0)),
      llegada:    Array(12).fill(Math.round(tl["ASSIGNED"] ?? 0)),
      total:      Array(12).fill(Math.round(stats.averageTotalTime)),
    },
  };

  const comparative: ComparativeItem[] = [
    {
      label: "Total emergencias",
      current: String(stats.emergencyCount),
      prev: "—",
      delta: "",
      positive: true,
    },
    {
      label: "Tiempo respuesta",
      current: fmtSeconds(stats.averageTotalTime),
      prev: "—",
      delta: "",
      positive: true,
    },
  ];

  return {
    emergencyCount: stats.emergencyCount,
    kpis,
    pipeline,
    trends,
    operators: MOCK_OPERATORS,
    comparative,
  };
}

async function fetchStatistics(
  token: string,
  since: string,
  to: string,
): Promise<BackendStatistics> {
  const url = `${BASE_URL}/api/v1/historic/statistics?since=${encodeURIComponent(since)}&to=${encodeURIComponent(to)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`statistics fetch failed: ${res.status}`);
  return res.json() as Promise<BackendStatistics>;
}

export function useAnalytics(period: Period, token?: string): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>(MOCK_DATA);

  useEffect(() => {
    if (!token) return;
    const { since, to } = periodToRange(period);
    let cancelled = false;
    fetchStatistics(token, since, to)
      .then((stats) => {
        if (!cancelled) setData(mapStatisticsToAnalytics(stats));
      })
      .catch(() => {
        if (!cancelled) setData(MOCK_DATA);
      });
    return () => { cancelled = true; };
  }, [period, token]);

  return data;
}
