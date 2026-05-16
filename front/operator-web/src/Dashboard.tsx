import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OperatorEmergency, TriageData } from "@/lib/api/interfaces";
import type { GeoLocation, OperatorUser, RoutePoint } from "@/lib/models";
import {
  RealOperatorService,
  RealParamedicLocationWatcher,
  RealRouteProvider,
} from "@/lib/api/real";
import { BASE_URL } from "@/lib/api/config";
import { haversineMeters } from "@/lib/utils/geo";
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
import { calcTriagePriority, type PriorityInfo } from "./hooks/operator/triagePriority";
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
  const [editForm, setEditForm] = useState<EditEmergencyFormData>(EMPTY_EDIT_FORM);
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

  // Triage / priority maps — derived (see declaration note above).
  const triageById = useMemo<Record<string, TriageData | null>>(
    () => Object.fromEntries(emergencies.map((e) => [e.id, e.triage])),
    [emergencies],
  );
  const priorityById = useMemo<Record<string, PriorityInfo>>(
    () =>
      Object.fromEntries(
        emergencies
          .filter((e) => e.triage)
          .map((e) => [e.id, calcTriagePriority(e.triage as TriageData)]),
      ),
    [emergencies],
  );

  // --- Live paramedic tracking (operator-side) ---------------------------
  // While the operator is viewing an emergency that has an assigned paramedic,
  // open a subscription to that paramedic's GPS and keep a live route to either
  // the citizen (ASSIGNED) or the chosen hospital (IN_TRANSFER).
  const watcherRef = useRef<RealParamedicLocationWatcher | null>(null);
  const routeProviderRef = useRef<RealRouteProvider | null>(null);
  if (!watcherRef.current) watcherRef.current = new RealParamedicLocationWatcher(user.token);
  if (!routeProviderRef.current) routeProviderRef.current = new RealRouteProvider(user.token);

  const [paramedicLocation, setParamedicLocation] = useState<GeoLocation | null>(null);
  const [paramedicRoute, setParamedicRoute] = useState<RoutePoint[] | null>(null);
  const lastRouteOriginRef = useRef<GeoLocation | null>(null);

  const trackedParamedicId = detailAlert?.assignedTo?.id ?? null;
  const trackedParamedicName = detailAlert?.assignedTo?.name ?? "";

  useEffect(() => {
    if (!trackedParamedicId) {
      console.log("[operator] no assigned paramedic — clearing live state");
      setParamedicLocation(null);
      setParamedicRoute(null);
      lastRouteOriginRef.current = null;
      return;
    }
    console.log("[operator] subscribing to paramedic GPS", trackedParamedicId);
    const watcher = watcherRef.current!;
    watcher.subscribe(trackedParamedicId, (loc) => {
      console.log("[operator] paramedic location received", loc);
      setParamedicLocation(loc);
    });
    return () => {
      console.log("[operator] unsubscribing from paramedic GPS", trackedParamedicId);
      watcher.unsubscribe(trackedParamedicId);
    };
  }, [trackedParamedicId]);

  // Tear down the watch WS when the dashboard unmounts.
  useEffect(() => {
    return () => watcherRef.current?.disconnect();
  }, []);

  // The destination depends on which stage the emergency is in. ON_SITE means
  // the paramedic is at the citizen, so no route is drawn.
  const routeDestination = useMemo<GeoLocation | null>(() => {
    if (!detailAlert) return null;
    if (detailAlert.state === "ASSIGNED") return detailAlert.location;
    if (detailAlert.state === "IN_TRANSFER") return detailAlert.transferedTo?.location ?? null;
    return null;
  }, [detailAlert]);

  // Refetch the route as the paramedic moves, but only when they've moved
  // past a 40m gate so the routing service isn't hammered every GPS tick.
  useEffect(() => {
    if (!paramedicLocation || !routeDestination) {
      setParamedicRoute(null);
      lastRouteOriginRef.current = null;
      return;
    }
    const last = lastRouteOriginRef.current;
    if (last && haversineMeters(last, paramedicLocation) < 40) return;
    let cancelled = false;
    routeProviderRef
      .current!.getRoute(paramedicLocation, routeDestination)
      .then((r) => {
        if (cancelled) return;
        lastRouteOriginRef.current = paramedicLocation;
        setParamedicRoute(r.points);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("Operator route fetch failed", e);
      });
    return () => {
      cancelled = true;
    };
  }, [paramedicLocation, routeDestination]);

  // Clear the cached route origin whenever the destination changes (e.g.
  // ASSIGNED → IN_TRANSFER), so the next GPS update forces a fresh request.
  useEffect(() => {
    lastRouteOriginRef.current = null;
  }, [routeDestination]);

  const paramedicsForMap = useMemo(
    () =>
      trackedParamedicId && paramedicLocation
        ? [{ id: trackedParamedicId, name: trackedParamedicName, location: paramedicLocation }]
        : [],
    [trackedParamedicId, trackedParamedicName, paramedicLocation],
  );

  const hospitalsForMap = useMemo(() => {
    const t = detailAlert?.transferedTo;
    if (!t?.location) return [];
    return [
      { id: t.id, name: t.name, latitude: t.location.latitude, longitude: t.location.longitude },
    ];
  }, [detailAlert]);

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
    setEditForm(EMPTY_EDIT_FORM);
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!detailAlertId) return;
    // Send EDIT_ALERT to the backend. Location update not exposed in the form yet;
    // sending null preserves the existing location.
    serviceRef.current.editAlert(detailAlertId, null, null);
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
                  paramedics={paramedicsForMap}
                  hospitals={hospitalsForMap}
                  routePoints={paramedicRoute}
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
        emergencyId={detailAlertId}
        token={user.token}
        onAssign={handleConfirmAssign}
        onCancel={() => setAssignModalOpen(false)}
      />
    </div>
  );
}
