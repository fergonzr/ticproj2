import * as str from "@/lib/strings";

export interface ParamedicCounts {
  available: number;
  onRoute: number;
  outOfService: number;
}

interface Props {
  operatorName: string;
  paramedicCounts: ParamedicCounts;
}

const CHIPS: { key: keyof ParamedicCounts; label: string; dot: string }[] = [
  { key: "available", label: "disponibles", dot: "#22c55e" },
  { key: "onRoute",   label: "en ruta",     dot: "#eab308" },
];

export default function Topbar({ operatorName, paramedicCounts }: Props) {
  return (
    <div className="h-12 bg-op-surface border-b border-op-border flex items-center px-5 justify-between shrink-0">
      <span className="text-[14px] font-semibold text-op-text">{str.operatorDashboardTitle}</span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          {CHIPS.map(({ key, label, dot }) => (
            <div key={key} className="flex items-center gap-[6px]">
              <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
              <span className="text-[12px] text-op-text-sec">
                {paramedicCounts[key]} {label}
              </span>
            </div>
          ))}
        </div>
        <div className="w-px h-5 bg-op-border" />
        <span className="text-[13px] font-semibold text-op-text-sec">{operatorName}</span>
      </div>
    </div>
  );
}
