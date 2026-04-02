import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useEmergencyList } from "./useEmergencyList";
import {
  ParamedicLocation,
  ParamedicStatus,
  Hospital,
  ToastData,
  SafeEmergency,
} from "@/lib/models";

export interface ParamedicWithStatus extends ParamedicLocation {
  status: ParamedicStatus;
}

const ACTIVE_STATUSES = new Set(["ASSIGNED", "ON_SITE", "IN_TRANSFER"]);

const COORDINATOR_PATH = "/api/v1/coordination/operator";

const MOCK_EMERGENCIES: SafeEmergency[] = [
  {
    id: "mock-1",
    alert: {
      reportedOn: new Date(Date.now() - 12 * 60000).toISOString(),
      medicalInfo: {
        firstName: "Salomé",
        lastName: "Pulgarín Rivera",
        phone: "3001234567",
        documentType: "NATIONAL_ID",
        documentNumber: "1017654321",
        age: "22",
        allergies: ["Rinitis", "Asma"],
        diseases: ["Túnel carpiano"],
        hasPacemaker: false,
        bloodType: "O_POSITIVE",
        dataConsent: true,
      },
      location: { latitude: 6.1714, longitude: -75.5901 },
    },
    assignedTo: null,
    status: "RECEIVED",
    triage: null,
    timeline: {},
  },
  {
    id: "mock-2",
    alert: {
      reportedOn: new Date(Date.now() - 8 * 60000).toISOString(),
      medicalInfo: {
        firstName: "Carlos",
        lastName: "Mejía Ossa",
        phone: "3109876543",
        documentType: "NATIONAL_ID",
        documentNumber: "1023456789",
        age: "47",
        allergies: [],
        diseases: ["Hipertensión"],
        hasPacemaker: true,
        bloodType: "A_POSITIVE",
        dataConsent: true,
      },
      location: { latitude: 6.168, longitude: -75.593 },
    },
    assignedTo: null,
    status: "TRIAGED",
    triage: {
      bleeding: false,
      dizziness: true,
      blurred_vision: true,
      unconscious: false,
      difficulty_breathing: false,
      fracture: false,
      chest_pain: true,
      numbness_limbs: false,
    },
    timeline: {},
  },
  {
    id: "mock-3",
    alert: {
      reportedOn: new Date(Date.now() - 5 * 60000).toISOString(),
      medicalInfo: {
        firstName: "Lucía",
        lastName: "Vargas Cano",
        phone: "3207654321",
        documentType: "NATIONAL_ID",
        documentNumber: "1045678901",
        age: "34",
        allergies: ["Penicilina"],
        diseases: [],
        hasPacemaker: false,
        bloodType: "B_NEGATIVE",
        dataConsent: true,
      },
      location: { latitude: 6.175, longitude: -75.588 },
    },
    assignedTo: null,
    status: "TRIAGED",
    triage: {
      bleeding: true,
      dizziness: false,
      blurred_vision: false,
      unconscious: false,
      difficulty_breathing: false,
      fracture: true,
      chest_pain: false,
      numbness_limbs: false,
    },
    timeline: {},
  },
  {
    id: "mock-4",
    alert: {
      reportedOn: new Date(Date.now() - 2 * 60000).toISOString(),
      medicalInfo: null,
      location: { latitude: 6.162, longitude: -75.595 },
    },
    assignedTo: {
      id: "para-2",
      name: "Diana Torres",
      userRole: "PARAMEDIC",
    },
    status: "ON_SITE",
    triage: null,
    timeline: {},
  },
];
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

  // Seed mock data when using the dev mock token
  useEffect(() => {
    if (token !== "mock-jwt-token") return;
    MOCK_EMERGENCIES.forEach((e) => upsertEmergency(e));
    listSelectEmergency("mock-1");
    setParamedics([
      {
        id: "para-1",
        name: "Andrés Gómez",
        location: { latitude: 6.1695, longitude: -75.5920 },
      },
      {
        id: "para-2",
        name: "Diana Torres",
        location: { latitude: 6.1640, longitude: -75.5890 },
      },
      {
        id: "para-3",
        name: "Felipe Morales",
        location: { latitude: 6.1720, longitude: -75.5960 },
        status: "OUT_OF_SERVICE",
      },
    ]);
  }, [token, upsertEmergency, listSelectEmergency]);

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

  const paramedicWithStatus = useMemo((): ParamedicWithStatus[] => {
    const busyIds = new Set(
      emergencyList
        .filter((e) => ACTIVE_STATUSES.has(e.status) && e.assignedTo)
        .map((e) => e.assignedTo!.id)
    );
    return paramedics.map((p) => ({
      ...p,
      status: p.status === "OUT_OF_SERVICE"
        ? "OUT_OF_SERVICE"
        : busyIds.has(p.id)
        ? "ON_ROUTE"
        : "AVAILABLE",
    }));
  }, [paramedics, emergencyList]);

  const selectEmergency = useCallback(
    (id: string) => {
      listSelectEmergency(id);
      const ws = coordinatorRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ command: "SUBSCRIBE", payload: id }));
      }
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
    paramedicWithStatus,
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
