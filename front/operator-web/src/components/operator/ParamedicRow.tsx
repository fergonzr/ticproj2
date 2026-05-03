import { paramedicStatusColors } from "@/lib/themes/Colors";
import { paramedicStatusLabels } from "@/lib/strings";

export interface ParamedicEntry {
  id: string;
  name: string;
  status: string;
}

interface Props {
  paramedic: ParamedicEntry;
  distanceKm: number | null;
  onAssign: (id: string) => void;
}

export default function ParamedicRow({ paramedic, distanceKm, onAssign }: Props) {
  const initials = paramedic.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const distanceLabel = distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "— km";
  const sc = paramedicStatusColors[paramedic.status] ?? paramedicStatusColors.AVAILABLE;
  const statusLabel = paramedicStatusLabels[paramedic.status] ?? paramedic.status;
  const canAssign = paramedic.status === "AVAILABLE";

  return (
    <div className="flex flex-row items-center bg-white mt-[6px] mx-2 rounded-[8px] border border-op-border p-4">
      <div className="w-[38px] h-[38px] rounded-full bg-[#b2dbd5] flex items-center justify-center mr-4 shrink-0">
        <span className="text-op-primary font-bold text-[13px] tracking-[0.5px]">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-op-text mb-[2px]">{paramedic.name}</div>
        <div className="text-[11px] text-[#757575] mb-[5px]">{distanceLabel}</div>
        <span
          className="inline-block px-2 py-[2px] rounded-[4px] border border-solid"
          style={{ background: sc.bg, borderColor: sc.border }}
        >
          <span className="text-[10px] font-bold tracking-[0.4px]" style={{ color: sc.text }}>{statusLabel}</span>
        </span>
      </div>
      {canAssign && (
        <button
          className="px-[14px] py-[7px] rounded-[6px] bg-op-primary text-white text-[12px] font-bold border-0 cursor-pointer"
          onClick={() => onAssign(paramedic.id)}
          type="button"
        >
          Asignar
        </button>
      )}
    </div>
  );
}
