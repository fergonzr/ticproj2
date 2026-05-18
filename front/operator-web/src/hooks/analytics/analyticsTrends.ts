import type { BackendEmergency } from "./emergencyStream";
import type { TrendData } from "./useAnalytics";

function receivedDate(e: BackendEmergency): Date | null {
  const iso = e.timeline?.["RECEIVED"];
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** Seconds between two timeline statuses, or null if either is missing
 *  or the span is non-positive. */
function diffSeconds(
  tl: Record<string, string> | undefined,
  fromStatus: string,
  toStatus: string,
): number | null {
  if (!tl) return null;
  const a = tl[fromStatus];
  const b = tl[toStatus];
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return ms > 0 ? ms / 1000 : null;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Bucket emergencies into the hourly/daily/monthly counts and the
 *  monthly KPI averages consumed by TrendChart. */
export function buildTrendData(emergencies: BackendEmergency[]): TrendData {
  const hourly  = Array<number>(24).fill(0);
  const daily   = Array<number>(7).fill(0);
  const monthly = Array<number>(12).fill(0);

  const triajeByMonth     = Array.from({ length: 12 }, () => [] as number[]);
  const asignacionByMonth = Array.from({ length: 12 }, () => [] as number[]);
  const llegadaByMonth    = Array.from({ length: 12 }, () => [] as number[]);
  const totalByMonth      = Array.from({ length: 12 }, () => [] as number[]);

  for (const e of emergencies) {
    const d = receivedDate(e);
    if (!d) continue;

    hourly[d.getHours()]++;
    daily[(d.getDay() + 6) % 7]++;   // Mon=0 ... Sun=6
    monthly[d.getMonth()]++;

    const month      = d.getMonth();
    const triaje     = diffSeconds(e.timeline, "RECEIVED", "TAKEN");
    const asignacion = diffSeconds(e.timeline, "TRIAGED", "ASSIGNED");
    const llegada    = diffSeconds(e.timeline, "ASSIGNED", "ON_SITE");
    const total      = diffSeconds(e.timeline, "RECEIVED", "CLOSED");
    if (triaje     !== null) triajeByMonth[month].push(triaje);
    if (asignacion !== null) asignacionByMonth[month].push(asignacion);
    if (llegada    !== null) llegadaByMonth[month].push(llegada);
    if (total      !== null) totalByMonth[month].push(total);
  }

  return {
    hourly,
    daily,
    monthly,
    kpis: {
      triaje:     triajeByMonth.map(average),
      asignacion: asignacionByMonth.map(average),
      llegada:    llegadaByMonth.map(average),
      total:      totalByMonth.map(average),
    },
  };
}
