import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "@/lib/api/config";
import { operatorUiColors as U, operatorStatusColors as S } from "@/lib/themes/Colors";
import type { NavIconType } from "../../components/operator/NavIcon";
import { useEmergencyStream } from "./useEmergencyStream";
import { buildTrendData } from "./analyticsTrends";

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
  stdev: string;
  kpis: KpiData[];
  pipeline: PipelineStage[];
  trends: TrendData;
  operators: OperatorData[];
  comparative: ComparativeItem[];
}

export interface AnalyticsState {
  loading: boolean;
  data:    AnalyticsData | null;
  error:   string | null;
}

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

/** The equal-length window immediately preceding the current period. */
function previousPeriodRange(period: Period): { since: string; to: string } {
  const { since, to } = periodToRange(period);
  const sinceMs = new Date(since).getTime();
  const span = new Date(to).getTime() - sinceMs;
  return { since: new Date(sinceMs - span).toISOString(), to: since };
}

function fmtSeconds(s: number): string {
  if (!isFinite(s) || s <= 0) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

function pctDelta(current: number, prev: number): number {
  if (prev <= 0) return 0;
  return Math.round(((current - prev) / prev) * 100);
}

function signedPct(current: number, prev: number): string {
  if (prev <= 0) return "";
  const pct = Math.round(((current - prev) / prev) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

interface OperatorRankingEntry {
  operator_id: string;
  name: string;
  count: number;
  averageHandlingTime: number;
}

interface ParamedicRankingEntry {
  paramedic_id: string;
  name: string;
  count: number;
  averageHandlingTime: number;
}

interface BackendStatistics {
  since: string;
  to: string;
  emergencyCount: number;
  averageTotalTime: number;
  averageTotalTimeStdev: number;
  averageTimeline: Record<string, number>;
  hourHistogram: Record<string, number>;
  operatorRanking: OperatorRankingEntry[];
  paramedicRanking: ParamedicRankingEntry[];
}

function buildKpis(
  cur: BackendStatistics,
  prev: BackendStatistics | null,
): KpiData[] {
  const ct = cur.averageTimeline;
  const pt = prev?.averageTimeline ?? {};
  const hasPrev = prev !== null && prev.emergencyCount > 0;

  const mk = (
    label: string,
    curVal: number,
    prevVal: number,
    icon: NavIconType,
    color: string,
  ): KpiData => ({
    label,
    value: fmtSeconds(curVal),
    avg: hasPrev ? fmtSeconds(prevVal) : "—",
    delta: hasPrev ? pctDelta(curVal, prevVal) : 0,
    icon,
    color,
  });

  return [
    mk("Tiempo triaje",     ct["RECEIVED"] ?? 0,  pt["RECEIVED"] ?? 0,  "triage",   S.triaged.accent),
    mk("Tiempo asignación", ct["TRIAGED"]  ?? 0,  pt["TRIAGED"]  ?? 0,  "assign",   S.assigned.accent),
    mk("Tiempo llegada",    ct["ASSIGNED"] ?? 0,  pt["ASSIGNED"] ?? 0,  "location", S.onSite.accent),
    mk("Tiempo total",      cur.averageTotalTime, prev?.averageTotalTime ?? 0, "history", U.primary),
    mk("Promedio en cola",  ct["RECEIVED"] ?? 0,  pt["RECEIVED"] ?? 0,  "alerts",   S.received.accent),
  ];
}

function buildPipeline(cur: BackendStatistics): PipelineStage[] {
  const tl = cur.averageTimeline;
  return [
    { stage: "Recibida",          time: fmtSeconds(tl["RECEIVED"] ?? 0),    color: S.received.accent },
    { stage: "Pend. asignación",  time: fmtSeconds(tl["TRIAGED"] ?? 0),     color: S.triaged.accent  },
    { stage: "Transfer. a sitio", time: fmtSeconds(tl["ASSIGNED"] ?? 0),    color: S.assigned.accent },
    { stage: "En sitio",          time: fmtSeconds(tl["ON_SITE"] ?? 0),     color: S.onSite.accent   },
    { stage: "Transfer. centro",  time: fmtSeconds(tl["IN_TRANSFER"] ?? 0), color: S.closed.accent   },
  ];
}

function buildOperators(cur: BackendStatistics): OperatorData[] {
  return cur.operatorRanking.map((o) => ({
    name: o.name,
    attended: o.count,
    avgTime: fmtSeconds(o.averageHandlingTime),
  }));
}

function buildComparative(
  cur: BackendStatistics,
  prev: BackendStatistics | null,
): ComparativeItem[] {
  const hasPrev = prev !== null && prev.emergencyCount > 0;
  const countDelta = hasPrev ? cur.emergencyCount - prev!.emergencyCount : 0;
  const timeDelta  = hasPrev ? cur.averageTotalTime - prev!.averageTotalTime : 0;

  return [
    {
      label: "Total emergencias",
      current: String(cur.emergencyCount),
      prev: hasPrev ? String(prev!.emergencyCount) : "—",
      delta: hasPrev ? signedPct(cur.emergencyCount, prev!.emergencyCount) : "",
      positive: countDelta >= 0,
    },
    {
      label: "Tiempo respuesta",
      current: fmtSeconds(cur.averageTotalTime),
      prev: hasPrev ? fmtSeconds(prev!.averageTotalTime) : "—",
      delta: hasPrev ? signedPct(cur.averageTotalTime, prev!.averageTotalTime) : "",
      positive: timeDelta <= 0,
    },
  ];
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

interface StatsState {
  loading: boolean;
  current: BackendStatistics | null;
  previous: BackendStatistics | null;
  error: string | null;
}

export function useAnalytics(period: Period, token?: string): AnalyticsState {
  const curRange  = useMemo(() => periodToRange(period), [period]);
  const prevRange = useMemo(() => previousPeriodRange(period), [period]);

  const stream = useEmergencyStream(curRange.since, curRange.to, token);

  const [stats, setStats] = useState<StatsState>({
    loading: !!token,
    current: null,
    previous: null,
    error: null,
  });

  useEffect(() => {
    if (!token) {
      setStats({ loading: false, current: null, previous: null, error: null });
      return;
    }
    let cancelled = false;
    setStats({ loading: true, current: null, previous: null, error: null });
    Promise.all([
      fetchStatistics(token, curRange.since, curRange.to),
      fetchStatistics(token, prevRange.since, prevRange.to),
    ])
      .then(([current, previous]) => {
        if (!cancelled) setStats({ loading: false, current, previous, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "fetch failed";
        setStats({ loading: false, current: null, previous: null, error: message });
      });
    return () => { cancelled = true; };
  }, [token, curRange.since, curRange.to, prevRange.since, prevRange.to]);

  const data = useMemo<AnalyticsData | null>(() => {
    if (!stats.current) return null;
    return {
      emergencyCount: stats.current.emergencyCount,
      stdev: fmtSeconds(stats.current.averageTotalTimeStdev),
      kpis: buildKpis(stats.current, stats.previous),
      pipeline: buildPipeline(stats.current),
      trends: buildTrendData(stream.emergencies),
      operators: buildOperators(stats.current),
      comparative: buildComparative(stats.current, stats.previous),
    };
  }, [stats.current, stats.previous, stream.emergencies]);

  return {
    loading: stats.loading || stream.loading,
    data,
    error: stats.error ?? stream.error,
  };
}
