import type { BackendEmergency } from "./emergencyStream";
import type { Period, TrendData } from "./useAnalytics";

const DAY_MS = 86_400_000;

const DAILY_LABELS   = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHLY_LABELS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function receivedDate(e: BackendEmergency): Date | null {
  const iso = e.timeline?.["RECEIVED"];
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** Count emergencies into `size` buckets via `indexOf`; skip out-of-range. */
function bucketCounts(
  emergencies: BackendEmergency[],
  size: number,
  indexOf: (d: Date) => number,
): number[] {
  const counts = Array<number>(size).fill(0);
  for (const e of emergencies) {
    const d = receivedDate(e);
    if (!d) continue;
    const i = indexOf(d);
    if (i >= 0 && i < size) counts[i]++;
  }
  return counts;
}

function buildHourly(emergencies: BackendEmergency[]): TrendData {
  const data = bucketCounts(emergencies, 24, (d) => d.getHours());
  const labels = Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? `${i}h` : ""));
  return { data, labels };
}

function buildWeekly(emergencies: BackendEmergency[]): TrendData {
  const data = bucketCounts(emergencies, 7, (d) => (d.getDay() + 6) % 7);
  return { data, labels: DAILY_LABELS };
}

function buildYearly(emergencies: BackendEmergency[]): TrendData {
  const data = bucketCounts(emergencies, 12, (d) => d.getMonth());
  return { data, labels: MONTHLY_LABELS };
}

function buildDaysOfMonth(
  emergencies: BackendEmergency[],
  range: { since: string; to: string },
): TrendData {
  const sinceMs = new Date(range.since).getTime();
  const toMs    = new Date(range.to).getTime();
  const days    = Math.max(1, Math.ceil((toMs - sinceMs) / DAY_MS));
  const data    = bucketCounts(emergencies, days, (d) =>
    Math.floor((d.getTime() - sinceMs) / DAY_MS),
  );
  const labels = Array.from({ length: days }, (_, i) => {
    if (i % 5 !== 0) return "";
    return String(new Date(sinceMs + i * DAY_MS).getDate());
  });
  return { data, labels };
}

/** Resolve the single bar-chart view that matches the dashboard period. */
export function buildTrendData(
  emergencies: BackendEmergency[],
  period: Period,
  range: { since: string; to: string },
): TrendData {
  switch (period) {
    case "today": return buildHourly(emergencies);
    case "week":  return buildWeekly(emergencies);
    case "year":  return buildYearly(emergencies);
    case "month": return buildDaysOfMonth(emergencies, range);
  }
}
