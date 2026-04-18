import type { OperatorEmergency } from "@/lib/api/interfaces";
import EmergencyCard from "./EmergencyCard";
import ParamedicRow, { type ParamedicEntry } from "./ParamedicRow";
import { styles } from "../../styles/operator/Sidebar.styles";

interface Props {
  mode: "emergencies" | "paramedics";
  emergencies: OperatorEmergency[];
  selectedId: string | null;
  paramedics: ParamedicEntry[];
  onSelectEmergency: (id: string) => void;
  onAssignParamedic: (id: string) => void;
  onBackToEmergencies?: () => void;
}

export default function Sidebar({
  mode,
  emergencies,
  selectedId,
  paramedics,
  onSelectEmergency,
  onAssignParamedic,
  onBackToEmergencies,
}: Props) {
  if (mode === "paramedics") {
    return (
      <div style={styles.container}>
        {onBackToEmergencies && (
          <button style={styles.backBar} onClick={onBackToEmergencies} type="button">
            <span style={styles.backText}>←</span>
            <span style={styles.backLabel}>Paramédicos</span>
          </button>
        )}
        <div style={styles.list}>
          {paramedics.length === 0 ? (
            <p style={styles.emptyText}>Sin paramédicos disponibles</p>
          ) : (
            paramedics.map((p) => (
              <ParamedicRow
                key={p.id}
                paramedic={p}
                distanceKm={null}
                onAssign={onAssignParamedic}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebarHeader}>
        <h3 style={styles.sidebarTitle}>Alertas activas</h3>
      </div>
      <div style={styles.list}>
        {emergencies.length === 0 ? (
          <p style={styles.emptyText}>Sin alertas activas</p>
        ) : (
          emergencies.map((em) => (
            <EmergencyCard
              key={em.id}
              emergency={em}
              isSelected={em.id === selectedId}
              onPress={onSelectEmergency}
            />
          ))
        )}
      </div>
    </div>
  );
}
