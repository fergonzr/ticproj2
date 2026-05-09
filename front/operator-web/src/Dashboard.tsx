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
import AssignParamedicModal from "./components/operator/AssignParamedicModal";

import { useTriageForm } from "./hooks/operator/useTriageForm";
import type { PriorityInfo } from "./hooks/operator/triagePriority";
import AnalyticsDashboard from "./views/AnalyticsDashboard";

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
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const assignedIdsRef = useRef<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<OperatorSection>("queue");
  const [detailAlertId, setDetailAlertId] = useState<string | null>(null);
  const [confirmEmergency, setConfirmEmergency] = useState<OperatorEmergency | null>(null);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditEmergencyFormData>(EMPTY_EDIT_FORM);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [priorityById, setPriorityById] = useState<Record<string, PriorityInfo>>({});
  const [triageById, setTriageById] = useState<Record<string, TriageData | null>>({});
  const [narrowViewport, setNarrowViewport] = useState(
    typeof window !== "undefined" && window.innerWidth < NARROW_BREAKPOINT,
  );

  const triageForm = useTriageForm();

  // Keep assignedIdsRef in sync so WS callbacks can read the latest value.
  useEffect(() => {
    assignedIdsRef.current = assignedIds;
  }, [assignedIds]);

  useEffect(() => {
    const onResize = () => setNarrowViewport(window.innerWidth < NARROW_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const svc = serviceRef.current;
    svc.connect(user.token, (event) => {
      switch (event.type) {
        // One USER_GREET is fired per queued emergency on connect.
        case "queue_emergency":
          setEmergencies((prev) =>
            prev.some((e) => e.id === event.emergency.id) ? prev : [...prev, event.emergency],
          );
          break;
        case "initial_queue":
          setEmergencies(event.emergencies);
          break;
        case "emergency_received":
          setEmergencies((prev) => [...prev, event.emergency]);
          setToast({ type: "EMERGENCY_RECEIVED", message: str.operatorToastEmergencyReceived });
          break;
        // Another operator took this emergency — remove from queue if we haven't taken it.
        case "emergency_taken":
          if (!assignedIdsRef.current.has(event.emergencyId)) {
            setEmergencies((prev) => prev.filter((e) => e.id !== event.emergencyId));
          }
          break;
        // Backend confirmed THIS operator took the emergency (status -> TAKEN, operatedBy set).
        case "emergency_operated": {
          const em = event.emergency;
          setAssignedIds((prev) => {
            if (prev.has(em.id)) return prev;
            const next = new Set(prev);
            next.add(em.id);
            return next;
          });
          setEmergencies((prev) =>
            prev.some((e) => e.id === em.id)
              ? prev.map((e) => (e.id === em.id ? em : e))
              : [...prev, em],
          );
          break;
        }
        // On (re)connect, backend replays one greet per emergency this operator owns.
        case "operated_greet": {
          const em = event.emergency;
          setAssignedIds((prev) => {
            if (prev.has(em.id)) return prev;
            const next = new Set(prev);
            next.add(em.id);
            return next;
          });
          setEmergencies((prev) =>
            prev.some((e) => e.id === em.id)
              ? prev.map((e) => (e.id === em.id ? em : e))
              : [...prev, em],
          );
          break;
        }
        // For all state-change events, replace the full emergency object from the server.
        case "emergency_triaged":
        case "emergency_arrived":
        case "emergency_complexity_assigned":
        case "emergency_transferred":
        case "alert_edited":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergency.id ? event.emergency : e)),
          );
          break;
        case "emergency_assigned":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergency.id ? event.emergency : e)),
          );
          setToast({ type: "PARAMEDIC_ACCEPTED", message: str.operatorToastParamedicAccepted });
          break;
        case "emergency_resolved":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergency.id ? event.emergency : e)),
          );
          setToast({ type: "EMERGENCY_RECEIVED", message: "Emergencia resuelta — lista para cerrar" });
          break;
        case "prehospital_care_reported":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergency.id ? event.emergency : e)),
          );
          setToast({ type: "EMERGENCY_RECEIVED", message: "Reporte prehospitalario recibido" });
          break;
        case "emergency_closed":
        case "emergency_canceled":
        case "assignment_canceled":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergency.id ? event.emergency : e)),
          );
          break;
        case "error":
          setErrorMsg(event.message);
          break;
      }
    });
    return () => svc.disconnect();
  }, [user.token]);

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

  const handleNavigate = useCallback((section: OperatorSection) => {
    setActiveSection(section);
    if (section !== "myAlerts") setDetailAlertId(null);
  }, []);

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
    // Subscribe the operator to this emergency on the backend.
    serviceRef.current.subscribeToEmergency(id);
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
    if (!detailAlertId) return;
    // Send EDIT_ALERT to the backend. Location update not exposed in the form yet;
    // sending null preserves the existing location.
    serviceRef.current.editAlert(detailAlertId, null);
    setEditModalOpen(false);
    setToast({ type: "EMERGENCY_RECEIVED", message: "Información actualizada" });
  }, [detailAlertId]);

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
          setAssignModalOpen(true);
          break;
        case "cancelAlert":
          if (detailAlertId) {
            serviceRef.current.cancelEmergency(detailAlertId, "Cancelada por operador");
            setToast({ type: "EMERGENCY_RECEIVED", message: "Alerta cancelada" });
          }
          break;
        case "close":
          if (detailAlertId) {
            serviceRef.current.closeEmergency(detailAlertId);
            releaseAlert(detailAlertId);
            setToast({ type: "EMERGENCY_RECEIVED", message: "Caso cerrado" });
            setTimeout(handleBackFromDetail, 1200);
          }
          break;
      }
    },
    [handleOpenTriage, handleOpenEdit, detailAlertId, handleBackFromDetail, releaseAlert],
  );

  const handleConfirmAssign = useCallback(
    (paramedicId: string) => {
      if (!detailAlertId) return;
      serviceRef.current.assignParamedic(detailAlertId, paramedicId);
      setAssignModalOpen(false);
      setToast({ type: "EMERGENCY_RECEIVED", message: "Paramédico asignado" });
    },
    [detailAlertId],
  );

  // ----- Derived UI state -----

  const inDetailView = activeSection === "myAlerts" && detailAlert !== null;

  const paramedicSummary: ParamedicSummary | null =
    detailAlert?.assignedTo
      ? {
          name: detailAlert.assignedTo.name,
          initials: detailAlert.assignedTo.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          etaMin: 8,
        }
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
    return null;
  };

  const isAnalyticsSection = activeSection === "analytics" || activeSection === "history";
  const selectedIdForMap = detailAlert?.id ?? null;
  const focusAlertId = inDetailView ? detailAlert!.id : null;
  const mapEmergencies =
    activeSection === "queue"
      ? queueEmergencies
      : activeSection === "myAlerts"
      ? myEmergencies
      : emergencies;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-op-bg">
      {errorMsg && (
        <div className="px-5 py-2 bg-[#fed7d7] text-op-error flex items-center gap-2 text-[13px]">
          <strong>{str.alertError}:</strong> {errorMsg}
          <button
            className="ml-auto bg-transparent border-0 cursor-pointer text-[20px] text-op-error leading-none"
            onClick={() => setErrorMsg(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-row min-h-0">
        <SideNav
          activeSection={activeSection}
          assignedCount={myEmergencies.length}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />

        {isAnalyticsSection ? (
          <AnalyticsDashboard token={user.token} />
        ) : (
          <>
            {renderLeftColumn()}

            <div className="flex-1 flex flex-col min-w-0 relative">
              <Topbar operatorName={user.name} paramedicCounts={paramedicCounts} />
              <div className="flex-1 relative overflow-hidden">
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
          </>
        )}
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

      <AssignParamedicModal
        isOpen={assignModalOpen}
        onAssign={handleConfirmAssign}
        onCancel={() => setAssignModalOpen(false)}
      />
    </div>
  );
}
