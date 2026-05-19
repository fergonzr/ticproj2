import { useHistory } from "../hooks/analytics/useHistory";
import HistoryTable from "../components/analytics/HistoryTable";
import type { Period } from "../hooks/analytics/useAnalytics";

interface Props { period: Period; token?: string }

export default function HistoryView({ period, token }: Props) {
  const { loading, rows, error } = useHistory(period, token);
  const hasData = rows.length > 0;

  if (loading && !hasData) {
    return <div className="h-[560px] rounded-[10px] bg-op-surface border border-op-border animate-pulse" />;
  }

  if (!loading && error) {
    return (
      <div className="h-[560px] rounded-[10px] bg-op-surface border border-op-border flex items-center justify-center text-[13px] text-op-text-ter">
        No se pudieron cargar los registros
      </div>
    );
  }

  if (!loading && !error && !hasData) {
    return (
      <div className="h-[560px] rounded-[10px] bg-op-surface border border-op-border flex items-center justify-center text-[13px] text-op-text-ter">
        Sin registros en este período
      </div>
    );
  }

  return <HistoryTable rows={rows} />;
}
