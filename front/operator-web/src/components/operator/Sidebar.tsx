import type { OperatorEmergency } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import EmergencyCard from "./EmergencyCard";
import AppButton from "./AppButton";

export type SidebarMode = "queue" | "myAlerts";

interface Props {
  emergencies: OperatorEmergency[];
  selectedId: string | null;
  mode: SidebarMode;
  onSelectEmergency: (id: string) => void;
  onTakeEmergency?: (id: string) => void;
  /** Abre el formulario de reporte de emergencia. Solo se usa en modo `queue`. */
  onReportEmergency?: () => void;
}

export default function Sidebar({
  emergencies,
  selectedId,
  mode,
  onSelectEmergency,
  onTakeEmergency,
  onReportEmergency,
}: Props) {
  const active = emergencies.filter((e) => e.state !== "CLOSED" && e.state !== "CANCELED");
  const title = mode === "queue" ? str.operatorQueueTitle : str.operatorMyAlertsTitle;
  const emptyMessage = mode === "queue" ? str.operatorNoEmergencies : str.operatorMyAlertsEmpty;

  return (
    <div className="w-[340px] border-r border-op-border bg-op-surface flex flex-col shrink-0">
      <div className="px-4 py-[14px] border-b border-op-border flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-op-text m-0">{title}</h3>
        <span className="text-[12px] text-op-text-ter font-semibold">{str.operatorAlertsCount(active.length)}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-[10px] py-[6px]">
        {active.length === 0 ? (
          <p className="text-center text-op-text-ter mt-8 text-[13px]">{emptyMessage}</p>
        ) : (
          active.map((em) => (
            <EmergencyCard
              key={em.id}
              emergency={em}
              isSelected={em.id === selectedId}
              mode={mode}
              onPress={onSelectEmergency}
              onTake={onTakeEmergency}
            />
          ))
        )}
      </div>
      {mode === "queue" && onReportEmergency && (
        <div className="px-4 py-3 border-t border-op-border">
          <AppButton
            title={str.operatorReportEmergencyBtn}
            onPress={onReportEmergency}
            fullWidth
          />
        </div>
      )}
    </div>
  );
}
