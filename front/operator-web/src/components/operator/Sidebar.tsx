import type { OperatorEmergency } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import EmergencyCard from "./EmergencyCard";
import { styles } from "../../styles/operator/Sidebar.styles";

export type SidebarMode = "queue" | "myAlerts";

interface Props {
  emergencies: OperatorEmergency[];
  selectedId: string | null;
  mode: SidebarMode;
  onSelectEmergency: (id: string) => void;
  onTakeEmergency?: (id: string) => void;
}

export default function Sidebar({
  emergencies,
  selectedId,
  mode,
  onSelectEmergency,
  onTakeEmergency,
}: Props) {
  const active = emergencies.filter((e) => e.state !== "CLOSED" && e.state !== "CANCELED");
  const title = mode === "queue" ? str.operatorQueueTitle : str.operatorMyAlertsTitle;
  const emptyMessage = mode === "queue" ? str.operatorNoEmergencies : str.operatorMyAlertsEmpty;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        <span style={styles.count}>{str.operatorAlertsCount(active.length)}</span>
      </div>
      <div style={styles.list}>
        {active.length === 0 ? (
          <p style={styles.emptyText}>{emptyMessage}</p>
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
    </div>
  );
}
