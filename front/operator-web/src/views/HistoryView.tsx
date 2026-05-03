import { useHistory } from "../hooks/analytics/useHistory";
import HistoryTable from "../components/analytics/HistoryTable";
import type { Period } from "../hooks/analytics/useAnalytics";

interface Props { period: Period }

export default function HistoryView({ period }: Props) {
  const rows = useHistory(period);
  return <HistoryTable rows={rows} />;
}
