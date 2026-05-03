import type { OperatorData } from "../../hooks/analytics/useAnalytics";

interface Props {
  operators: OperatorData[];
}

const HEADER_COLS = ["#", "Operador", "Atend.", "T.prom", ""];

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function OperatorsTable({ operators }: Props) {
  const maxAttended = Math.max(...operators.map((o) => o.attended), 1);

  return (
    <div>
      <div className="grid [grid-template-columns:24px_1fr_60px_50px_14px] py-[6px] border-b border-op-border gap-[6px]">
        {HEADER_COLS.map((h, i) => (
          <span key={i} className="text-[9px] font-bold text-op-text-ter tracking-[0.5px] uppercase">{h}</span>
        ))}
      </div>

      {operators.map((op, i) => (
        <div
          key={i}
          className="grid [grid-template-columns:24px_1fr_60px_50px_14px] py-2 items-center gap-[6px]"
          style={{ borderBottom: i < operators.length - 1 ? "1px solid #f0f0f0" : "none" }}
        >
          <span className="text-[11px] text-op-text-ter font-semibold">{i + 1}</span>

          <div className="flex items-center gap-[7px] min-w-0">
            <div className="w-6 h-6 rounded-full bg-op-primary text-white flex items-center justify-center text-[9px] font-bold shrink-0">
              {initials(op.name)}
            </div>
            <span className="text-[12px] font-semibold text-op-text whitespace-nowrap overflow-hidden text-ellipsis">
              {op.name}
            </span>
          </div>

          <div>
            <div className="text-[13px] font-bold text-op-text">{op.attended}</div>
            <div className="h-[3px] rounded-[2px] bg-op-border-light mt-[2px]">
              <div
                className="h-full rounded-[2px] bg-op-primary opacity-70"
                style={{ width: `${(op.attended / maxAttended) * 100}%` }}
              />
            </div>
          </div>

          <span className="text-[12px] text-op-text-sec">{op.avgTime}</span>

          <span
            className={`inline-block w-2 h-2 rounded-full justify-self-center ${op.active ? "bg-op-success" : "bg-op-text-ter"}`}
          />
        </div>
      ))}
    </div>
  );
}
