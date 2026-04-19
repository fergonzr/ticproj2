import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OperatorEmergency, TriageData } from "@/lib/api/interfaces";
import type { OperatorUser } from "@/lib/models";
import { RealOperatorService } from "@/lib/api/real";
import * as str from "@/lib/strings";

import Topbar from "./components/operator/Topbar";
import Sidebar from "./components/operator/Sidebar";
import SideNav, { type OperatorSection } from "./components/operator/SideNav";
import DetailPanel, {
  type DetailAction,
  type ParamedicSummary,
} from "./components/operator/DetailPanel";
import ConfirmModal from "./components/operator/ConfirmModal";
import OperatorMapView from "./components/operator/OperatorMapView";
import TriageModal from "./components/operator/TriageModal";
import EditEmergencyModal, {
  type EditEmergencyFormData,
} from "./components/operator/EditEmergencyModal";
import ToastNotification, {
  type ToastData,
} from "./components/operator/ToastNotification";
import FloatingAlertsTracker from "./components/operator/FloatingAlertsTracker";

import { useTriageForm } from "./hooks/operator/useTriageForm";
import type { PriorityInfo } from "./hooks/operator/triagePriority";
import { styles } from "./styles/operator/Dashboard.styles";

const EMPTY_EDIT_FORM: EditEmergencyFormData = {
  fullName: "",
  estimatedAge: "",
  knownConditions: "",
  observations: "",
};

const NARROW_BREAKPOINT = 1280;

type Props = { user: OperatorUser; onLogout: () => void };

export default function Dashboard({ user, onLogout }: Props) {
  const serviceRef = useRef(new RealOperatorService());
  const [emergencies, setEmergencies] = useState<OperatorEmergency[]>([]);
  // TODO(backend): derive `assignedIds` from `OperatorEmergency.assignedOperatorId`
  // once the backend exposes it (along with events emergency_assigned_to_operator /
  // emergency_taken_by_other). Until then we track the operator's assignments client-side.
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<OperatorSection>("queue");
  const [detailAlertId, setDetailAlertId] = useState<string | null>(null);
  const [confirmEmergency, setConfirmEmergency] = useState<OperatorEmergency | null>(null);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditEmergencyFormData>(EMPTY_EDIT_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [priorityById, setPriorityById] = useState<Record<string, PriorityInfo>>({});
  const [triageById, setTriageById] = useState<Record<string, TriageData | null>>({});
  const [narrowViewport, setNarrowViewport] = useState(
    typeof window !== "undefined" && window.innerWidth < NARROW_BREAKPOINT,
  );

  const triageForm = useTriageForm();

  useEffect(() => {
    const onResize = () => setNarrowViewport(window.innerWidth < NARROW_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const svc = serviceRef.current;
    svc.connect(user.token, (event) => {
      switch (event.type) {
        case "initial_queue":
          setEmergencies(event.emergencies);
          break;
        case "emergency_received":
          setEmergencies((prev) => [...prev, event.emergency]);
          setToast({ type: "EMERGENCY_RECEIVED", message: str.operatorToastEmergencyReceived });
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
          setToast({ type: "PARAMEDIC_ACCEPTED", message: str.operatorToastParamedicAccepted });
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

  // Queue = alerts nobody has taken yet (in this client session).
  // TODO(backend): replace by filter on assignedOperatorId == null.
  const queueEmergencies = useMemo(
    () => emergencies.filter((e) => !assignedIds.has(e.id)),
    [emergencies, assignedIds],
  );

  const myEmergencies = useMemo(
    () =>
      emergencies.filter(
        (e) => assignedIds.has(e.id) && e.state !== "CLOSED" && e.state !== "CANCELED",
      ),
    [emergencies, assignedIds],
  );

  const detailAlert = useMemo(
    () => (detailAlertId ? emergencies.find((e) => e.id === detailAlertId) ?? null : null),
    [detailAlertId, emergencies],
  );

  const paramedicCounts = { available: 0, onRoute: 0, outOfService: 0 };

  // ----- Navigation handlers -----

  const handleNavigate = useCallback(
    (section: OperatorSection) => {
      setActiveSection(section);
      if (section !== "myAlerts") setDetailAlertId(null);
    },
    [],
  );

  const handleSelectFromQueue = useCallback((id: string) => {
    setDetailAlertId(id);
  }, []);

  const handleSelectFromMyAlerts = useCallback((id: string) => {
    setDetailAlertId(id);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setDetailAlertId(null);
  }, []);

  // ----- Take alert (queue → my alerts) -----

  const handleTake = useCallback(
    (id: string) => {
      const em = emergencies.find((e) => e.id === id);
      if (!em) return;
      if (em.state === "RECEIVED" || em.state === "TRIAGED") {
        setConfirmEmergency(em);
      }
    },
    [emergencies],
  );

  const handleConfirmTake = useCallback(() => {
    if (!confirmEmergency) return;
    const id = confirmEmergency.id;
    // TODO(backend): call svc.takeEmergency(id) once the endpoint exists.
    setAssignedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setConfirmEmergency(null);
    setActiveSection("myAlerts");
    setDetailAlertId(null);
    setToast({ type: "EMERGENCY_RECEIVED", message: "Alerta tomada exitosamente" });
  }, [confirmEmergency]);

  // ----- Detail actions -----

  const handleOpenTriage = useCallback(() => {
    triageForm.reset();
    setTriageModalOpen(true);
  }, [triageForm]);

  const handleSendTriage = useCallback(
    (priority: PriorityInfo) => {
      if (!detailAlertId) return;
      const payload = triageForm.toTriageData();
      serviceRef.current.triageEmergency(detailAlertId, payload);
      setPriorityById((prev) => ({ ...prev, [detailAlertId]: priority }));
      setTriageById((prev) => ({ ...prev, [detailAlertId]: payload }));
      setTriageModalOpen(false);
      setToast({
        type: "EMERGENCY_RECEIVED",
        message: `Triaje completado — Nivel: ${priority.label}`,
      });
    },
    [detailAlertId, triageForm],
  );

  const handleOpenEdit = useCallback(() => {
    setEditForm(EMPTY_EDIT_FORM);
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    // TODO: POST /api/v1/emergencies/:id/enrich when backend endpoint is ready
    setEditModalOpen(false);
    setToast({ type: "EMERGENCY_RECEIVED", message: "Información actualizada" });
  }, []);

  const releaseAlert = useCallback((id: string) => {
    setAssignedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleDetailAction = useCallback(
    (action: DetailAction) => {
      switch (action) {
        case "triage":
          handleOpenTriage();
          break;
        case "edit":
          handleOpenEdit();
          break;
        case "callCitizen":
          setToast({ type: "EMERGENCY_RECEIVED", message: "Llamando al ciudadano..." });
          break;
        case "callParamedic":
          setToast({ type: "EMERGENCY_RECEIVED", message: "Llamando al paramédico..." });
          break;
        case "callHospital":
          setToast({ type: "EMERGENCY_RECEIVED", message: "Llamando al hospital..." });
          break;
        case "assign":
          // TODO: open AssignParamedicModal when paramedic list is available
          setToast({ type: "EMERGENCY_RECEIVED", message: "Sin paramédicos disponibles" });
          break;
        case "cancelAlert":
          if (detailAlertId) {
            setEmergencies((prev) =>
              prev.map((e) => (e.id === detailAlertId ? { ...e, state: "CANCELED" } : e)),
            );
            releaseAlert(detailAlertId);
            setToast({ type: "EMERGENCY_RECEIVED", message: "Alerta cancelada" });
            setTimeout(handleBackFromDetail, 1200);
          }
          break;
        case "close":
          if (detailAlertId) {
            setEmergencies((prev) =>
              prev.map((e) => (e.id === detailAlertId ? { ...e, state: "CLOSED" } : e)),
            );
            releaseAlert(detailAlertId);
            setToast({ type: "EMERGENCY_RECEIVED", message: "Caso cerrado" });
            setTimeout(handleBackFromDetail, 1200);
          }
          break;
      }
    },
    [handleOpenTriage, handleOpenEdit, detailAlertId, handleBackFromDetail, releaseAlert],
  );

  // ----- Derived UI state -----

  const inDetailView = activeSection === "myAlerts" && detailAlert !== null;

  const paramedicSummary: ParamedicSummary | null =
    detailAlert &&
    (detailAlert.state === "ASSIGNED" ||
      detailAlert.state === "ON_SITE" ||
      detailAlert.state === "IN_TRANSFER")
      ? { name: "Javier Peláez", initials: "JP", etaMin: 8 }
      : null;

  const renderLeftColumn = () => {
    if (activeSection === "queue") {
      return (
        <Sidebar
          emergencies={queueEmergencies}
          selectedId={null}
          mode="queue"
          onSelectEmergency={handleSelectFromQueue}
          onTakeEmergency={handleTake}
        />
      );
    }
    if (activeSection === "myAlerts") {
      if (detailAlert) {
        return (
          <DetailPanel
            emergency={detailAlert}
            triagePriority={priorityById[detailAlert.id] ?? null}
            paramedic={paramedicSummary}
            onBack={handleBackFromDetail}
            onAction={handleDetailAction}
          />
        );
      }
      return (
        <Sidebar
          emergencies={myEmergencies}
          selectedId={null}
          mode="myAlerts"
          onSelectEmergency={handleSelectFromMyAlerts}
        />
      );
    }
    // TODO: hospitals / paramedics / analytics / history / settings panels.
    return null;
  };

  const selectedIdForMap = detailAlert?.id ?? null;
  const focusAlertId = inDetailView ? detailAlert!.id : null;
  const mapEmergencies =
    activeSection === "queue"
      ? queueEmergencies
      : activeSection === "myAlerts"
      ? myEmergencies
      : emergencies;

  return (
    <div style={styles.root}>
      {errorMsg && (
        <div style={styles.errorBanner}>
          <strong>{str.alertError}:</strong> {errorMsg}
          <button style={styles.dismissBtn} onClick={() => setErrorMsg(null)}>
            ×
          </button>
        </div>
      )}

      <div style={styles.body}>
        <SideNav
          activeSection={activeSection}
          assignedCount={myEmergencies.length}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />

        {renderLeftColumn()}

        <div style={styles.main}>
          <Topbar operatorName={user.name} paramedicCounts={paramedicCounts} />
          <div style={styles.mapArea}>
            <OperatorMapView
              emergencies={mapEmergencies}
              triageById={triageById}
              selectedId={selectedIdForMap}
              focusAlertId={focusAlertId}
              onSelectEmergency={handleSelectFromMyAlerts}
            />
            {inDetailView && (
              <FloatingAlertsTracker
                alerts={myEmergencies}
                activeAlertId={detailAlert!.id}
                onSelect={handleSelectFromMyAlerts}
                narrowViewport={narrowViewport}
              />
            )}
            <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
          </div>
        </div>
      </div>

      <ConfirmModal
        emergency={confirmEmergency}
        onConfirm={handleConfirmTake}
        onCancel={() => setConfirmEmergency(null)}
      />

      <TriageModal
        isOpen={triageModalOpen}
        form={triageForm.form}
        onSetField={triageForm.setField}
        onSubmit={handleSendTriage}
        onCancel={() => setTriageModalOpen(false)}
      />

      <EditEmergencyModal
        isOpen={editModalOpen}
        form={editForm}
        onSetField={(field, value) =>
          setEditForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleSaveEdit}
        onCancel={() => setEditModalOpen(false)}
      />
    </div>
  );
}
