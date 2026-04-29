import type { ComparativeItem } from "../../hooks/analytics/useAnalytics";
import Card from "./Card";
import { styles } from "../../styles/analytics/ComparativeCard.styles";

interface Props {
  items: ComparativeItem[];
}

export default function ComparativeCard({ items }: Props) {
  return (
    <Card title="Comparativa" subtitle="vs mes anterior">
      <div style={styles.list}>
        {items.map((item, i) => (
          <div key={i} style={styles.item}>
            <div>
              <div style={styles.label}>{item.label}</div>
              <div style={styles.values}>
                <span style={styles.current}>{item.current}</span>
                <span style={styles.prev}>prev: {item.prev}</span>
              </div>
            </div>
            <span style={item.positive ? styles.deltaGood : styles.deltaBad}>
              {item.delta}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
