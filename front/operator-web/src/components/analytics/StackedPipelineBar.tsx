import type { PipelineStage } from "../../hooks/analytics/useAnalytics";

interface Props {
  stages: PipelineStage[];
  stdev: string;
}

function parseSeconds(time: string): number {
  const m = time.match(/(\d+)\s*m/);
  const s = time.match(/(\d+)\s*s/);
  return (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0);
}

function formatTotal(sec: number): string {
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${sec}s`;
}

export default function StackedPipelineBar({ stages, stdev }: Props) {
  const segs = stages.map((s) => ({ ...s, sec: parseSeconds(s.time) }));
  const total = segs.reduce((a, b) => a + b.sec, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[11px] text-op-text-ter tracking-[0.6px] font-semibold uppercase">Tiempo total</span>
        <span className="text-[26px] font-bold text-op-text tracking-[-0.5px]">{formatTotal(total)}</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-8 rounded-[7px] overflow-hidden border border-op-border">
        {segs.map((seg, i) => (
          <div
            key={i}
            title={`${seg.stage}: ${seg.time}`}
            className="flex items-center justify-center text-white text-[11px] font-bold min-w-[36px] opacity-90"
            style={{
              flex: seg.sec,
              background: seg.color,
              borderRight: i < segs.length - 1 ? "1px solid rgba(255,255,255,.4)" : "none",
            }}
          >
            {Math.round((seg.sec / total) * 100)}%
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-5 gap-2 mt-3">
        {segs.map((seg, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            <div className="flex items-center gap-[6px]">
              <div className="w-[9px] h-[9px] rounded-[3px] shrink-0" style={{ background: seg.color }} />
              <span className="text-[10px] text-op-text-ter leading-[1.1] overflow-hidden text-ellipsis whitespace-nowrap">
                {seg.stage}
              </span>
            </div>
            <span className="text-[13px] font-bold text-op-text pl-[15px]">{seg.time}</span>
          </div>
        ))}
      </div>

      {/* Std dev footer */}
      <div className="mt-3 px-3 py-2 bg-op-bg rounded-[7px] flex justify-between items-center">
        <span className="text-[11px] text-op-text-sec">Desviación estándar</span>
        <span className="text-[12px] font-bold text-op-text">±{stdev}</span>
      </div>
    </div>
  );
}
