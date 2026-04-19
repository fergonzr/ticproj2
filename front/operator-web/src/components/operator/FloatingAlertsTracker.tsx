import { useEffect, useState } from "react";
import type { OperatorEmergency } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import { statusInfo, minutesSince } from "../../hooks/operator/statusScheme";
import { styles } from "../../styles/operator/FloatingAlertsTracker.styles";

interface Props {
  alerts: OperatorEmergency[];
  activeAlertId: string | null;
  onSelect: (id: string) => void;
  narrowViewport?: boolean;
}

export default function FloatingAlertsTracker({
  alerts,
  activeAlertId,
  onSelect,
  narrowViewport = false,
}: Props) {
  const [open, setOpen] = useState(!narrowViewport);

  useEffect(() => {
    if (narrowViewport) setOpen(false);
  }, [narrowViewport]);

  if (alerts.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        title={str.operatorTrackerToggleOpen}
        aria-label={str.operatorTrackerToggleOpen}
        onClick={() => setOpen(true)}
        style={styles.fab}
      >
        {alerts.length}
        <span style={styles.fabBadge}>{alerts.length > 9 ? "9+" : alerts.length}</span>
      </button>
    );
  }

  return (
    <div style={styles.panel} role="region" aria-label={str.operatorTrackerTitle}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>{str.operatorTrackerTitle}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={styles.headerCount}>{alerts.length}</span>
          <button
            type="button"
            title={str.operatorTrackerToggleClose}
            aria-label={str.operatorTrackerToggleClose}
            onClick={() => setOpen(false)}
            style={styles.toggleBtn}
          >
            ×
          </button>
        </div>
      </div>
      <div style={styles.list}>
        {alerts.map((em) => {
          const { label, scheme } = statusInfo(em.state);
          const mins = minutesSince(em.reportedOn);
          const isActive = em.id === activeAlertId;
          return (
            <button
              key={em.id}
              type="button"
              onClick={() => onSelect(em.id)}
              style={{
                ...styles.item,
                ...(isActive ? styles.itemActive : null),
                borderLeftColor: scheme.accent,
              }}
            >
              <div style={styles.itemTopRow}>
                <span style={styles.itemId}>ALT-{em.id.slice(-3)}</span>
                <span style={styles.itemTime}>{str.operatorMinutesAgo(mins)}</span>
              </div>
              <span
                style={{
                  ...styles.itemStatus,
                  background: scheme.bg,
                  color: scheme.text,
                  border: `1px solid ${scheme.border}`,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
