import { useHistory } from "../hooks/analytics/useHistory";
import HistoryTable from "../components/analytics/HistoryTable";
import type { Period } from "../hooks/analytics/useAnalytics";

interface Props { period: Period; token?: string }

export default function HistoryView({ period, token }: Props) {
  const rows = useHistory(period, token);
  return <HistoryTable rows={rows} />;
}
