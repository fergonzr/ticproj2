import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OperatorEmergency, TriageData } from "@/lib/api/interfaces";
import type { OperatorUser } from "@/lib/models";
import { RealOperatorService } from "@/lib/api/real";
import { BASE_URL } from "@/lib/api/config";
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
import EditEmergencyModal from "./components/operator/EditEmergencyModal";
import ToastNotification, {
  type ToastData,
} from "./components/operator/ToastNotification";
import FloatingAlertsTracker from "./components/operator/FloatingAlertsTracker";
import AssignParamedicModal from "./components/operator/AssignParamedicModal";

import { useTriageForm } from "./hooks/operator/useTriageForm";
import { useEmergencyEditor } from "./hooks/operator/useEmergencyEditor";
import { useParamedicTracking } from "./hooks/operator/useParamedicTracking";
import type { PriorityInfo } from "./hooks/operator/triagePriority";
import AnalyticsDashboard from "./views/AnalyticsDashboard";

const NARROW_BREAKPOINT = 1280;

type Props = { user: OperatorUser; onLogout: () => void };

export default function Dashboard({ user, onLogout }: Props) {
  const serviceRef = useRef(new RealOperatorService());
  const [emergencies, setEmergencies] = useState<OperatorEmergency[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const assignedIdsRef = useRef<Set<string>>(new Set());
  const detailAlertIdRef = useRef<string | null>(null);
  const greetedIdsRef = useRef<Set<string>>(new Set());
  const cancelAttemptedIdRef = useRef<string | null>(null);

  // Persist dismissed emergency IDs across page reloads so the backend's
  // reconnect replay never re-surfaces an alert the operator already dismissed.
  const dismissedKey = `op_dismissed_${user.id}`;
  const getDismissed = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(dismissedKey) ?? "[]") as string[]); }
    catch { return new Set(); }
  };
  const persistDismiss = (id: string): void => {
    try { const s = getDismissed(); s.add(id); localStorage.setItem(dismissedKey, JSON.stringify([...s])); }
    catch { /* localStorage unavailable */ }
  };

  const [activeSection, setActiveSection] = useState<OperatorSection>("queue");
  const [detailAlertId, setDetailAlertId] = useState<string | null>(null);
  const [confirmEmergency, setConfirmEmergency] = useState<OperatorEmergency | null>(null);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  // Derived from `emergencies` so they always reflect the latest server state —
  // including emergencies triaged by other operators and re-greets after reconnect.
  // (Previously these were imperative state only ever written by this operator's
  // own triage action, so observers and reconnects rendered stale triage chips.)
  const [narrowViewport, setNarrowViewport] = useState(
    typeof window !== "undefined" && window.innerWidth < NARROW_BREAKPOINT,
  );

  const triageForm = useTriageForm();

  // Keep refs in sync so WS callbacks can read the latest values.
  useEffect(() => { assignedIdsRef.current = assignedIds; }, [assignedIds]);
  useEffect(() => { detailAlertIdRef.current = detailAlertId; }, [detailAlertId]);

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
          if (getDismissed().has(event.emergency.id)) break;
          greetedIdsRef.current.add(event.emergency.id);
          setEmergencies((prev) =>
            prev.some((e) => e.id === event.emergency.id) ? prev : [...prev, event.emergency],
          );
          break;
        case "initial_queue":
          setEmergencies(event.emergencies.filter((e) => !getDismissed().has(e.id)));
          break;
        case "emergency_received":
          setEmergencies((prev) =>
            prev.some((e) => e.id === event.emergency.id)
              ? prev.map((e) => (e.id === event.emergency.id ? event.emergency : e))
              : [...prev, event.emergency],
          );
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
          if (getDismissed().has(em.id)) break;
          greetedIdsRef.current.add(em.id);
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
          persistDismiss(event.emergency.id);
          setEmergencies((prev) => prev.filter((e) => e.id !== event.emergency.id));
          releaseAlert(event.emergency.id);
          setDetailAlertId((prev) => (prev === event.emergency.id ? null : prev));
          if (event.type === "emergency_canceled") {
            // Notify when cancelled by the citizen or another operator.
            // If this operator initiated the cancel, skip the extra toast.
            if (cancelAttemptedIdRef.current === event.emergency.id) {
              cancelAttemptedIdRef.current = null;
            } else {
              setToast({
                type: "EMERGENCY_RECEIVED",
                message: "Una emergencia fue cancelada",
              });
            }
          } else {
            // emergency_closed — clear cancel ref if this operator initiated it.
            if (cancelAttemptedIdRef.current === event.emergency.id) {
              cancelAttemptedIdRef.current = null;
            }
          }
          break;
        case "assignment_canceled":
          setEmergencies((prev) =>
            prev.map((e) => (e.id === event.emergency.id ? event.emergency : e)),
          );
          releaseAlert(event.emergencyId);
          break;
        case "error": {
          const msg = event.message.toLowerCase();
          const isNotFound = msg.includes("no emergency with that id");
          const isInvalidOp = msg.includes("invalid operation");
          const clickedId = detailAlertIdRef.current;
          const cancelledId = cancelAttemptedIdRef.current;

          // Case 1: operator clicked cancel but backend rejected it — force-dismiss.
          if (isInvalidOp && cancelledId) {
            cancelAttemptedIdRef.current = null;
            persistDismiss(cancelledId);
            setEmergencies((prev) => prev.filter((e) => e.id !== cancelledId));
            releaseAlert(cancelledId);
            if (detailAlertIdRef.current === cancelledId) setDetailAlertId(null);
            greetedIdsRef.current.delete(cancelledId);
            setToast({ type: "EMERGENCY_RECEIVED", message: "Alerta eliminada" });
            break;
          }

          // Case 2: stale emergency from reconnect replay — auto-remove silently.
          if (isNotFound || (isInvalidOp && !clickedId)) {
            const toRemove = clickedId
              ? new Set([clickedId])
              : new Set(greetedIdsRef.current);
            if (toRemove.size > 0) {
              setEmergencies((prev) => prev.filter((e) => !toRemove.has(e.id)));
              toRemove.forEach((id) => { releaseAlert(id); persistDismiss(id); });
              if (clickedId) setDetailAlertId(null);
              greetedIdsRef.current.clear();
              setToast({ type: "EMERGENCY_RECEIVED", message: "Alerta obsoleta eliminada automáticamente" });
              break;
            }
          }

          setErrorMsg(event.message);
          break;
        }
      }
    });
    return () => svc.disconnect();
  }, [user.token]);

  const queueEmergencies = useMemo(
    () => emergencies.filter((e) => !assignedIds.has(e.id) && e.state !== "CANCELED"),
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

  const emergencyEditor = useEmergencyEditor(detailAlert);

  // Triage map — derived from the emergency stream so the TriageModal can
  // hydrate a saved triage when the operator reopens an already-triaged case.
  // (Priority is no longer pre-computed here: DetailPanel resolves it inline
  // via `getCurrentCriticality`, which also handles the paramedic retriage.)
  const triageById = useMemo<Record<string, TriageData | null>>(
    () => Object.fromEntries(emergencies.map((e) => [e.id, e.triage])),
    [emergencies],
  );

  // --- Live paramedic tracking ------------------------------------------
  // Subscribes to the assigned paramedic's GPS, fetches a route to the
  // current destination (citizen during ASSIGNED, hospital during
  // IN_TRANSFER), and tells us when the incident pin should be hidden
  // because the paramedic is on site. All the state-machine and side-
  // effect plumbing lives inside the hook; we just consume its result.
  const tracking = useParamedicTracking(detailAlert, user.token);

  const paramedicsForMap = useMemo(
    () =>
      tracking.paramedicLocation && detailAlert?.assignedTo
        ? [{
            id: detailAlert.assignedTo.id,
            name: detailAlert.assignedTo.name,
            location: tracking.paramedicLocation,
          }]
        : [],
    [tracking.paramedicLocation, detailAlert?.assignedTo],
  );

  const hospitalsForMap = useMemo(
    () =>
      tracking.destinationPin?.kind === "hospital"
        ? [{
            id: tracking.destinationPin.id,
            name: tracking.destinationPin.name,
            latitude: tracking.destinationPin.latitude,
            longitude: tracking.destinationPin.longitude,
          }]
        : [],
    [tracking.destinationPin],
  );

  // Live paramedic roster counts from the backend. Polled every 10s.
  // The fallback derives `onRoute` from the operator's own emergency stream so
  // the chip stays useful when the backend endpoint is unreachable.
  const [backendCounts, setBackendCounts] = useState<{ available: number; onRoute: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/paramedicRecommendation/active`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) return;
        const body = (await res.json()) as { available: number; onRoute: number };
        if (!cancelled) setBackendCounts({ available: body.available, onRoute: body.onRoute });
      } catch {
        /* leave previous counts; fall back to derived in render */
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user.token]);

  const paramedicCounts = useMemo(() => {
    const derivedOnRoute = emergencies.filter((e) =>
      ["ASSIGNED", "ON_SITE", "IN_TRANSFER"].includes(e.state),
    ).length;
    return {
      available: backendCounts?.available ?? null,
      onRoute: backendCounts?.onRoute ?? derivedOnRoute,
      outOfService: 0,
    };
  }, [backendCounts, emergencies]);

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
      // No optimistic map write — triageById/priorityById derive from
      // `emergencies`, which the `emergency_triaged` echo updates.
      setTriageModalOpen(false);
      setToast({
        type: "EMERGENCY_RECEIVED",
        message: `Triaje completado — Nivel: ${priority.label}`,
      });
    },
    [detailAlertId, triageForm],
  );

  const handleOpenEdit = useCallback(() => {
    // The editor hook re-initializes from `detailAlert` on its own.
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!detailAlertId) return;
    const payload = emergencyEditor.buildPayload();
    if (!payload) return; // validation failed — errors are shown in the modal
    serviceRef.current.editAlert(
      detailAlertId,
      payload.location,
      payload.medicalInfo,
    );
    setEditModalOpen(false);
    setToast({ type: "EMERGENCY_RECEIVED", message: "Información actualizada" });
  }, [detailAlertId, emergencyEditor]);

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
            cancelAttemptedIdRef.current = detailAlertId;
            serviceRef.current.cancelEmergency(detailAlertId, "Cancelada por operador");
            setToast({ type: "EMERGENCY_RECEIVED", message: "Cancelando alerta..." });
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

  // When the paramedic is on site, hide the incident pin from the map: the
  // paramedic marker is already sitting on the same coordinates, so a
  // separate pin would just clutter the view.
  const mapEmergenciesFiltered = useMemo(
    () =>
      tracking.hideEmergencyPin && detailAlert
        ? mapEmergencies.filter((e) => e.id !== detailAlert.id)
        : mapEmergencies,
    [mapEmergencies, tracking.hideEmergencyPin, detailAlert],
  );

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
                  emergencies={mapEmergenciesFiltered}
                  triageById={triageById}
                  selectedId={selectedIdForMap}
                  focusAlertId={focusAlertId}
                  onSelectEmergency={handleSelectFromMyAlerts}
                  paramedics={paramedicsForMap}
                  hospitals={hospitalsForMap}
                  routePoints={tracking.paramedicRoute}
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
        editor={emergencyEditor}
        onSubmit={handleSaveEdit}
        onCancel={() => setEditModalOpen(false)}
      />

      <AssignParamedicModal
        isOpen={assignModalOpen}
        emergencyId={detailAlertId}
        token={user.token}
        onAssign={handleConfirmAssign}
        onCancel={() => setAssignModalOpen(false)}
      />
    </div>
  );
}
