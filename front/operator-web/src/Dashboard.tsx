import { useCallback, useEffect, useRef, useState } from "react";
import type { OperatorEmergency, TriageData } from "@/lib/api/interfaces";
import type { OperatorUser } from "@/lib/models";
import { RealOperatorService } from "@/lib/api/real";
import * as str from "@/lib/strings";
import { colors } from "@/lib/themes/Colors";

const EMPTY_TRIAGE: TriageData = {
  bleeding: false,
  dizziness: false,
  blurred_vision: false,
  unconscious: false,
  difficulty_breathing: false,
  fracture: false,
  chest_pain: false,
  numbness_limbs: false,
};

const TRIAGE_LABELS: [keyof TriageData, string][] = [
  ["bleeding", str.triageBleeding],
  ["dizziness", str.triageDizziness],
  ["blurred_vision", str.triageBlurredVision],
  ["unconscious", str.triageUnconscious],
  ["difficulty_breathing", str.triageDifficultyBreathing],
  ["fracture", str.triageFracture],
  ["chest_pain", str.triageChestPain],
  ["numbness_limbs", str.triageNumbnessLimbs],
];

function stateLabel(state: string): string {
  switch (state) {
    case "RECEIVED": return str.operatorStateReceived;
    case "TRIAGED":  return str.operatorStateTriaged;
    case "ASSIGNED": return str.operatorStateAssigned;
    case "ON_SITE":  return str.operatorStateOnsite;
    default:         return str.operatorStateUnknown;
  }
}

function stateColor(state: string): string {
  switch (state) {
    case "RECEIVED": return colors.error;
    case "TRIAGED":  return colors.warning;
    case "ASSIGNED": return colors.primary;
    case "ON_SITE":  return colors.success;
    default:         return colors.placeholder;
  }
}

type Props = { user: OperatorUser; onLogout: () => void };

export default function Dashboard({ user, onLogout }: Props) {
  const serviceRef = useRef(new RealOperatorService());
  const [emergencies, setEmergencies] = useState<OperatorEmergency[]>([]);
  const [triageTarget, setTriageTarget] = useState<OperatorEmergency | null>(null);
  const [assignTarget, setAssignTarget] = useState<OperatorEmergency | null>(null);
  const [triage, setTriage] = useState<TriageData>(EMPTY_TRIAGE);
  const [paramedicId, setParamedicId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const svc = serviceRef.current;
    svc.connect(user.token, (event) => {
      switch (event.type) {
        case "initial_queue":
          setEmergencies(event.emergencies);
          break;
        case "emergency_received":
          setEmergencies((prev) => [...prev, event.emergency]);
          break;
        case "emergency_triaged":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergencyId ? { ...e, state: "TRIAGED" } : e)),
          );
          break;
        case "emergency_assigned":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergencyId ? { ...e, state: "ASSIGNED" } : e)),
          );
          break;
        case "emergency_arrived":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergencyId ? { ...e, state: "ON_SITE" } : e)),
          );
          break;
        case "error":
          setErrorMsg(event.message);
          break;
      }
    });
    return () => svc.disconnect();
  }, [user.token]);

  const openTriage = useCallback((em: OperatorEmergency) => {
    setTriage(EMPTY_TRIAGE);
    setTriageTarget(em);
  }, []);

  const handleTriage = useCallback(() => {
    if (!triageTarget) return;
    serviceRef.current.triageEmergency(triageTarget.id, triage);
    setTriageTarget(null);
  }, [triageTarget, triage]);

  const openAssign = useCallback((em: OperatorEmergency) => {
    setParamedicId("");
    setAssignTarget(em);
  }, []);

  const handleAssign = useCallback(() => {
    if (!assignTarget) return;
    if (!paramedicId.trim()) {
      alert(str.alertOperatorAssignIdRequired);
      return;
    }
    serviceRef.current.assignParamedic(assignTarget.id, paramedicId.trim());
    setAssignTarget(null);
    setParamedicId("");
  }, [assignTarget, paramedicId]);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{ ...s.header, background: colors.primary }}>
        <div>
          <span style={s.headerTitle}>{str.operatorDashboardTitle}</span>
          <span style={s.headerSub}>{user.name}</span>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div style={{ ...s.errorBanner, background: "#fed7d7", color: colors.error }}>
          <strong>{str.alertError}:</strong> {errorMsg}
          <button style={{ ...s.dismissBtn, color: colors.error }} onClick={() => setErrorMsg(null)}>×</button>
        </div>
      )}

      {/* Emergency list */}
      <div style={s.list}>
        {emergencies.length === 0 ? (
          <p style={{ ...s.empty, color: colors.placeholder }}>{str.operatorNoEmergencies}</p>
        ) : (
          emergencies.map((em) => (
            <EmergencyCard
              key={em.id}
              emergency={em}
              onTriage={() => openTriage(em)}
              onAssign={() => openAssign(em)}
            />
          ))
        )}
      </div>

      {/* Triage modal */}
      {triageTarget && (
        <Modal onClose={() => setTriageTarget(null)}>
          <h2 style={s.modalTitle}>{str.operatorTriageTitle}</h2>
          <p style={{ ...s.modalSub, color: colors.placeholder }}>#{triageTarget.id.slice(-6)}</p>
          {TRIAGE_LABELS.map(([field, label]) => (
            <label key={field} style={s.toggleRow}>
              <span style={s.toggleLabel}>{label}</span>
              <input
                type="checkbox"
                checked={triage[field]}
                onChange={() => setTriage((prev) => ({ ...prev, [field]: !prev[field] }))}
                style={{ width: 20, height: 20, cursor: "pointer" }}
              />
            </label>
          ))}
          <div style={s.modalActions}>
            <button style={{ ...s.outlineBtn, color: colors.primary, borderColor: colors.primary }} onClick={() => setTriageTarget(null)}>
              {str.btnCancel}
            </button>
            <button style={{ ...s.primaryBtn, background: colors.primary }} onClick={handleTriage}>
              {str.btnTriage}
            </button>
          </div>
        </Modal>
      )}

      {/* Assign modal */}
      {assignTarget && (
        <Modal onClose={() => setAssignTarget(null)}>
          <h2 style={s.modalTitle}>{str.operatorAssignTitle}</h2>
          <p style={{ ...s.modalSub, color: colors.placeholder }}>#{assignTarget.id.slice(-6)}</p>
          <label style={s.inputLabel}>{str.operatorParamedicIdLabel}</label>
          <input
            type="text"
            value={paramedicId}
            onChange={(e) => setParamedicId(e.target.value)}
            placeholder={str.operatorParamedicIdPlaceholder}
            style={{ ...s.textInput, borderColor: colors.border }}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <div style={s.modalActions}>
            <button style={{ ...s.outlineBtn, color: colors.primary, borderColor: colors.primary }} onClick={() => setAssignTarget(null)}>
              {str.btnCancel}
            </button>
            <button style={{ ...s.primaryBtn, background: colors.primary }} onClick={handleAssign}>
              {str.btnAssign}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- EmergencyCard ---

type CardProps = {
  emergency: OperatorEmergency;
  onTriage: () => void;
  onAssign: () => void;
};

function EmergencyCard({ emergency, onTriage, onAssign }: CardProps) {
  const color = stateColor(emergency.state);
  const canTriage = emergency.state === "RECEIVED";
  const canAssign = emergency.state === "TRIAGED";

  return (
    <div style={{ ...s.card, background: colors.white }}>
      <div style={s.cardHeader}>
        <span style={{ ...s.dot, background: color }} />
        <span style={s.cardId}>#{emergency.id.slice(-6)}</span>
        <span style={{ ...s.cardState, color }}>{stateLabel(emergency.state)}</span>
      </div>
      <p style={{ ...s.cardDetail, color: colors.placeholder }}>
        {str.operatorLocation}: {emergency.location.latitude.toFixed(4)},{" "}
        {emergency.location.longitude.toFixed(4)}
      </p>
      {emergency.medicalInfo && (
        <p style={{ ...s.cardDetail, color: colors.placeholder }}>
          {str.operatorMedicalInfo}: {emergency.medicalInfo}
        </p>
      )}
      {(canTriage || canAssign) && (
        <div style={s.cardActions}>
          {canTriage && (
            <button style={{ ...s.primaryBtn, background: colors.primary }} onClick={onTriage}>
              {str.btnTriage}
            </button>
          )}
          {canAssign && (
            <button style={{ ...s.primaryBtn, background: colors.primary }} onClick={onAssign}>
              {str.btnAssign}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Modal ---

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, background: colors.white }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// --- Styles ---

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: colors.surface },
  header: {
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 700, marginRight: 12 },
  headerSub: { color: colors.whiteAlpha, fontSize: 14 },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.4)",
    color: colors.white,
    borderRadius: 8,
    padding: "6px 16px",
    cursor: "pointer",
    fontSize: 14,
  },
  errorBanner: {
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
  },
  dismissBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
  },
  list: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    maxWidth: 720,
    margin: "0 auto",
  },
  empty: { textAlign: "center", marginTop: 64, fontSize: 16 },
  card: {
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  cardId: { fontWeight: 700, fontSize: 15, flex: 1 },
  cardState: { fontSize: 13, fontWeight: 600 },
  cardDetail: { fontSize: 13, marginTop: 2 },
  cardActions: { display: "flex", gap: 8, marginTop: 12 },
  overlay: {
    position: "fixed",
    inset: 0,
    background: colors.overlay,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 440,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: { fontSize: 18, fontWeight: 700, textAlign: "center" },
  modalSub: { fontSize: 14, textAlign: "center", marginTop: -8 },
  modalActions: { display: "flex", gap: 10, marginTop: 4 },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 0",
    cursor: "pointer",
  },
  toggleLabel: { fontSize: 15, flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: 600 },
  textInput: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 15,
    outline: "none",
    width: "100%",
  },
  primaryBtn: {
    flex: 1,
    padding: "10px 16px",
    color: colors.white,
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  outlineBtn: {
    flex: 1,
    padding: "10px 16px",
    background: colors.white,
    border: "2px solid",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
