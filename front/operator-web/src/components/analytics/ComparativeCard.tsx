import type { ComparativeItem } from "../../hooks/analytics/useAnalytics";
import Card from "./Card";

interface Props {
  items: ComparativeItem[];
}

export default function ComparativeCard({ items }: Props) {
  return (
    <Card title="Comparativa" subtitle="vs mes anterior">
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="px-[10px] py-2 bg-op-bg rounded-[7px] flex justify-between items-center">
            <div>
              <div className="text-[11px] text-op-text-sec mb-[2px]">{item.label}</div>
              <div className="flex items-baseline gap-[6px]">
                <span className="text-[15px] font-bold text-op-text">{item.current}</span>
                <span className="text-[10px] text-op-text-ter">prev: {item.prev}</span>
              </div>
            </div>
            <span className={`text-[12px] font-bold ${item.positive ? "text-op-success" : "text-op-error"}`}>
              {item.delta}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
