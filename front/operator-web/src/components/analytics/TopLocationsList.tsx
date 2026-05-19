import type { TopLocationsState } from "../../hooks/analytics/useTopLocations";

interface Props {
  state: TopLocationsState;
}

function subtitleFor(state: TopLocationsState): string {
  if (state.loading && state.rows.length === 0) return "Cargando ubicaciones…";
  if (state.loading) return `Actualizando… ${state.rows.length} de 5`;
  return `${state.rows.length} zonas`;
}

export default function TopLocationsList({ state }: Props) {
  const { loading, rows } = state;
  const topCount = rows.reduce((m, r) => Math.max(m, r.count), 0);
  const showSkeleton = loading && rows.length === 0;
  const showEmpty    = !loading && rows.length === 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[13px] font-bold text-op-text">
          Top 5 ubicaciones con más incidentes
        </span>
        <span className="text-[11px] text-op-text-ter">{subtitleFor(state)}</span>
      </div>

      {showSkeleton && (
        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`grid items-center py-[10px] gap-3 ${
                i < 4 ? "border-b border-op-border-light" : ""
              }`}
              style={{ gridTemplateColumns: "36px 1fr auto" }}
            >
              <div className="w-7 h-7 rounded-full bg-op-bg animate-pulse" />
              <div className="h-3 rounded bg-op-bg animate-pulse" />
              <div className="h-3 w-20 rounded bg-op-bg animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {showEmpty && (
        <div className="py-6 text-center text-[12px] text-op-text-ter">
          Sin datos de ubicaciones disponibles
        </div>
      )}

      {!showSkeleton && !showEmpty && (
        <div className="flex flex-col">
          {rows.map((row, i) => {
            const pct = topCount > 0 ? (row.count / topCount) * 100 : 0;
            return (
              <div
                key={row.label}
                className={`py-[10px] ${
                  i < rows.length - 1 ? "border-b border-op-border-light" : ""
                }`}
              >
                <div
                  className="grid items-center gap-3"
                  style={{ gridTemplateColumns: "36px 1fr auto" }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                      row.rank === 1
                        ? "bg-op-primary text-white"
                        : "bg-op-bg border border-op-border text-op-text-sec"
                    }`}
                  >
                    {row.rank}
                  </div>
                  <span className="text-[13px] text-op-text font-semibold truncate min-w-0">
                    {row.label}
                  </span>
                  <span className="text-[12px] text-op-text-sec font-mono">
                    {row.count} incidentes
                  </span>
                </div>
                <div className="mt-[6px] h-[3px] rounded-full bg-op-primary-light overflow-hidden">
                  <div
                    className="h-full bg-op-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
