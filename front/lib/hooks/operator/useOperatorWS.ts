import { useState, useEffect, useRef, useCallback } from "react";
import { useEmergencyList } from "./useEmergencyList";
import {
  ParamedicLocation,
  Hospital,
  ToastData,
  SafeEmergency,
} from "@/lib/models";

const COORDINATOR_PATH = "/api/v1/coordination/operator";
const LOCATION_PATH = "/api/v1/locationTracker";
const HOSPITALS_PATH = "/api/v1/hospitals";
const TOAST_MS = 5000;

export interface UseOperatorWSOptions {
  host: string;  // e.g. "localhost:7999"
  token: string; // JWT
}

export function useOperatorWS({ host, token }: UseOperatorWSOptions) {
  const {
    emergencies,
    emergencyList,
    selectedId,
    selectedEmergency,
    upsertEmergency,
    selectEmergency: listSelectEmergency,
  } = useEmergencyList();

  const [paramedics, setParamedics] = useState<ParamedicLocation[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [sidebarMode, setSidebarMode] = useState<"emergencies" | "paramedics">(
    "emergencies"
  );
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const coordinatorRef = useRef<WebSocket | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((data: ToastData) => {
    setToast(data);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  // Load hospitals via REST
  useEffect(() => {
    fetch(`http://${host}${HOSPITALS_PATH}`)
      .then((r) => r.json())
      .then((data: Hospital[]) => setHospitals(data))
      .catch(() => {/* hospitals unavailable — map still works */});
  }, [host]);

  // Coordinator WebSocket
  useEffect(() => {
    if (!token) return; // skip until login completes
    const ws = new WebSocket(`ws://${host}${COORDINATOR_PATH}?token=${token}`);
    coordinatorRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ command: "SET_AVAILABILITY", payload: true }));
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data) as {
        event: string;
        payload: SafeEmergency;
      };
      switch (msg.event) {
        case "USER_GREET":
          upsertEmergency(msg.payload);
          listSelectEmergency(msg.payload.id);
          break;
        case "EMERGENCY_RECEIVED":
          upsertEmergency(msg.payload);
          break;
        case "EMERGENCY_TRIAGED":
          upsertEmergency(msg.payload);
          break;
        case "EMERGENCY_ASSIGNED":
          upsertEmergency(msg.payload);
          showToast({
            type: "PARAMEDIC_ACCEPTED",
            message: `Paramédico ${msg.payload.assignedTo?.name ?? ""} aceptó la emergencia`,
          });
          break;
        case "EMERGENCY_ARRIVED":
          upsertEmergency(msg.payload);
          break;
      }
    };

    return () => {
      ws.close();
      coordinatorRef.current = null;
    };
  }, [host, token, upsertEmergency, listSelectEmergency, showToast]);

  // Location tracker WebSocket
  useEffect(() => {
    if (!token) return; // skip until login completes
    const ws = new WebSocket(`ws://${host}${LOCATION_PATH}?token=${token}`);

    ws.onmessage = (event: MessageEvent) => {
      const loc = JSON.parse(event.data) as ParamedicLocation;
      setParamedics((prev) => {
        const idx = prev.findIndex((p) => p.id === loc.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = loc;
          return updated;
        }
        return [...prev, loc];
      });
    };

    return () => ws.close();
  }, [host, token]);

  const selectEmergency = useCallback(
    (id: string) => {
      listSelectEmergency(id);
      coordinatorRef.current?.send(
        JSON.stringify({ command: "SUBSCRIBE", payload: id })
      );
    },
    [listSelectEmergency]
  );

  const sendTriage = useCallback(
    (emergencyId: string, triage: object) => {
      coordinatorRef.current?.send(
        JSON.stringify({
          command: "TRIAGE_EMERGENCY",
          payload: { emergencyId, triage },
        })
      );
      setTriageModalOpen(false);
    },
    []
  );

  const assignParamedic = useCallback(
    (paramedicId: string) => {
      if (!selectedId) return;
      coordinatorRef.current?.send(
        JSON.stringify({
          command: "REQUEST_EMERGENCY_ASSIGNMENT",
          payload: { emergencyId: selectedId, paramedicId },
        })
      );
      setSidebarMode("emergencies");
    },
    [selectedId]
  );

  return {
    emergencies,
    emergencyList,
    selectedId,
    selectedEmergency,
    paramedics,
    hospitals,
    toast,
    sidebarMode,
    triageModalOpen,
    editModalOpen,
    selectEmergency,
    sendTriage,
    assignParamedic,
    setSidebarMode,
    openTriageModal: () => setTriageModalOpen(true),
    closeTriageModal: () => setTriageModalOpen(false),
    openEditModal: () => setEditModalOpen(true),
    closeEditModal: () => setEditModalOpen(false),
    dismissToast,
  };
}
