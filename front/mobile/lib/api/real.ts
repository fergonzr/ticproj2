import { BASE_URL, WS_BASE_URL } from "./config";
import {
  EmergencyUpdateListener,
  ParamedicAuthenticator,
  EmergencyAssignmentListener,
  ParamedicLocationTracker,
  OperatorAuthenticator,
  OperatorService,
  OperatorEvent,
  OperatorEmergency,
  TriageData,
} from "./interfaces";
import {
  Alert,
  EmergencyCase,
  EmergencyStatus,
  EmergencyAssignment,
  GeoLocation,
  MedicalInfo,
  ParamedicUser,
  OperatorUser,
} from "../models";
import { InvalidCredentialsError, AssignmentAcceptError } from "./errors";

// --- Shared helpers ---

function toOperatorEmergency(payload: Record<string, unknown>): OperatorEmergency {
  const alert = (payload.alert as Record<string, unknown> | undefined) ?? {};
  const loc = (alert.location as Record<string, number> | undefined) ?? {};
  const assignedTo = (payload.assignedTo as Record<string, unknown> | undefined) ?? null;
  const transferedTo = (payload.transferedTo as Record<string, unknown> | undefined) ?? null;
  const rawTriage = payload.triage as Record<string, boolean> | null | undefined;
  const triage: TriageData | null = rawTriage
    ? {
        bleeding: rawTriage.bleeding ?? false,
        dizziness: rawTriage.dizziness ?? false,
        blurred_vision: rawTriage.blurred_vision ?? false,
        unconscious: rawTriage.unconscious ?? false,
        difficulty_breathing: rawTriage.difficulty_breathing ?? false,
        fracture: rawTriage.fracture ?? false,
        chest_pain: rawTriage.chest_pain ?? false,
        numbness_limbs: rawTriage.numbness_limbs ?? false,
      }
    : null;
  return {
    id: (payload.id ?? "") as string,
    filingNumber: (payload.filingNumber ?? 0) as number,
    location: {
      latitude: (loc.latitude ?? 0) as number,
      longitude: (loc.longitude ?? 0) as number,
    },
    medicalInfo: (alert.medicalInfo ?? "") as string,
    state: (payload.status ?? "RECEIVED") as string,
    reportedOn: (alert.generatedOn ?? new Date().toISOString()) as string,
    assignedTo: assignedTo
      ? { id: (assignedTo.id ?? "") as string, name: (assignedTo.name ?? "") as string }
      : null,
    triage,
    complexityLevel: (payload.complexityLevel ?? null) as number | null,
    cancelReason: (payload.cancelReason ?? null) as string | null,
    transferedTo: transferedTo
      ? { id: (transferedTo.id ?? "") as string, name: (transferedTo.name ?? "") as string }
      : null,
    timeline: (payload.timeline ?? {}) as Record<string, string>,
  };
}

function buildEmergencyCase(payload: Record<string, unknown>): EmergencyCase {
  const alert = (payload.alert as Record<string, unknown> | undefined) ?? {};
  const loc = (alert.location as Record<string, number> | undefined) ?? {};
  const location: GeoLocation = {
    latitude: (loc.latitude ?? 0) as number,
    longitude: (loc.longitude ?? 0) as number,
  };

  const medicalInfo: MedicalInfo = {
    firstName: "Paciente",
    lastName: "",
    phone: "",
    documentType: "NATIONAL_ID",
    documentNumber: "",
    age: "",
    allergies: [],
    diseases: [],
    hasPacemaker: null,
    bloodType: "",
    dataConsent: null,
  };

  return {
    id: payload.id as string | undefined,
    reportedOn: new Date((alert.generatedOn as string | undefined) ?? Date.now()),
    medicalInfo,
    location,
    emergencyState: EmergencyStatus.RECEIVED,
  };
}

async function fetchToken(email: string, password: string, role: string): Promise<string> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const response = await fetch(`${BASE_URL}/api/v1/auth/token?role=${role}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) throw new InvalidCredentialsError();
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function fetchUserProfile(
  token: string,
): Promise<{ id: string; email: string; name: string; userRole: string }> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/whoami`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new InvalidCredentialsError();
  return response.json() as Promise<{ id: string; email: string; name: string; userRole: string }>;
}

// --- Auth ---

export class RealParamedicAuthenticator implements ParamedicAuthenticator {
  async login(email: string, password: string): Promise<ParamedicUser> {
    const token = await fetchToken(email, password, "PARAMEDIC");
    const profile = await fetchUserProfile(token);
    return { id: profile.id, email: profile.email, name: profile.name, token };
  }
}

export class RealOperatorAuthenticator implements OperatorAuthenticator {
  async login(email: string, password: string): Promise<OperatorUser> {
    // Try OPERATOR first; if the user has a different role the backend returns 401,
    // so we fall back to ANALYST before surfacing an error to the user.
    let token: string;
    let role: string;
    try {
      token = await fetchToken(email, password, "OPERATOR");
      role = "OPERATOR";
    } catch {
      token = await fetchToken(email, password, "ANALYST");
      role = "ANALYST";
    }
    const profile = await fetchUserProfile(token);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      token,
      userRole: profile.userRole ?? role,
    };
  }
}

// --- Citizen emergency listener ---

export class RealEmergencyUpdateListener implements EmergencyUpdateListener {
  async reportEmergency(
    alert: Alert,
    onStatusChange: (emergencyCase: EmergencyCase) => void,
  ): Promise<EmergencyCase> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_BASE_URL}/api/v1/coordination/citizen`);
      let storedCase: EmergencyCase | null = null;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            command: "REPORT_EMERGENCY",
            payload: {
              location: alert.location
                ? { latitude: alert.location.latitude, longitude: alert.location.longitude }
                : null,
              generatedOn: alert.reportedOn.toISOString(),
              medicalInfo: null,
            },
          }),
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string) as {
          event: string;
          payload?: Record<string, unknown>;
        };

        if (msg.event === "EMERGENCY_RECEIVED") {
          storedCase = {
            id: msg.payload?.id as string | undefined,
            reportedOn: alert.reportedOn,
            medicalInfo: alert.medicalInfo as MedicalInfo,
            location: alert.location as GeoLocation,
            emergencyState: EmergencyStatus.RECEIVED,
          };
          resolve(storedCase);
          return;
        }

        if (!storedCase) return;

        let newState: EmergencyStatus | null = null;
        if (msg.event === "EMERGENCY_TRIAGED") {
          newState = EmergencyStatus.DISPATCHED;
        } else if (msg.event === "EMERGENCY_ASSIGNED") {
          newState = EmergencyStatus.ON_ROUTE;
        } else if (msg.event === "EMERGENCY_ARRIVED") {
          newState = EmergencyStatus.ON_SITE;
        } else if (msg.event === "EMERGENCY_TRANSFERRED") {
          newState = EmergencyStatus.ON_ROUTE;
        } else if (msg.event === "EMERGENCY_RESOLVED" || msg.event === "EMERGENCY_CLOSED") {
          newState = EmergencyStatus.CLOSED;
        } else if (msg.event === "EMERGENCY_CANCELED") {
          newState = EmergencyStatus.CANCELLED;
        }

        if (newState !== null) {
          storedCase = { ...storedCase, emergencyState: newState };
          onStatusChange(storedCase);
        }
      };

      ws.onerror = () => reject(new Error("Citizen WebSocket connection failed"));
    });
  }
}

// --- Paramedic tracker + assignment listener ---

export class RealParamedicTrackerAndListener
  implements ParamedicLocationTracker, EmergencyAssignmentListener
{
  private token: string;
  private locationWs: WebSocket | null = null;
  private coordinationWs: WebSocket | null = null;

  constructor(token: string) {
    this.token = token;
  }

  async reportLocation(_paramedicId: string, location: GeoLocation): Promise<void> {
    if (this.locationWs?.readyState !== WebSocket.OPEN) return;
    this.locationWs.send(
      JSON.stringify({
        command: "UPDATE_LOCATION",
        payload: { latitude: location.latitude, longitude: location.longitude },
      }),
    );
  }

  startListening(
    _paramedicId: string,
    onNewAssignment: (assignment: EmergencyAssignment) => void,
    onError?: (reason: "auth_error" | "connection_error") => void,
  ): void {
    this.stopListening();
    const ws = new WebSocket(
      `${WS_BASE_URL}/api/v1/locationTracker?token=${this.token}`,
    );
    this.locationWs = ws;

    ws.onopen = () => console.log("[locationTracker] WS connected");
    ws.onclose = (e) => {
      console.warn("[locationTracker] WS closed", e.code, e.reason);
      if (e.reason?.includes("403") || e.reason?.includes("401")) {
        onError?.("auth_error");
      } else if (e.code !== 1000) {
        onError?.("connection_error");
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as {
        event: string;
        payload?: Record<string, unknown>;
      };

      if (msg.event === "ASSIGNMENT_REQUESTED") {
        const payload = msg.payload ?? {};
        onNewAssignment({
          id: (payload.id ?? "") as string,
          emergencyCase: buildEmergencyCase(payload),
          offeredAt: new Date(),
        });
      }
    };

    ws.onerror = (e) => console.warn("[locationTracker] WS error", e);
  }

  stopListening(): void {
    this.locationWs?.close();
    this.locationWs = null;
  }

  async acceptAssignment(assignmentId: string): Promise<EmergencyCase> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(
        `${WS_BASE_URL}/api/v1/coordination/paramedic/${assignmentId}?token=${this.token}`,
      );
      this.coordinationWs = ws;

      const timeout = setTimeout(() => {
        reject(new AssignmentAcceptError());
      }, 15_000);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string) as {
          event: string;
          payload?: Record<string, unknown>;
        };
        if (msg.event === "EMERGENCY_ASSIGNED") {
          clearTimeout(timeout);
          resolve(buildEmergencyCase(msg.payload ?? {}));
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new AssignmentAcceptError());
      };
    });
  }

  async rejectAssignment(_assignmentId: string): Promise<void> {
    // The backend has no explicit reject command; not connecting is sufficient.
  }

  async reportArrival(): Promise<void> {
    if (this.coordinationWs?.readyState !== WebSocket.OPEN) return;
    this.coordinationWs.send(
      JSON.stringify({ command: "ANNOUNCE_ARRIVAL", payload: null }),
    );
  }
}

// --- Operator service ---

export class RealOperatorService implements OperatorService {
  private ws: WebSocket | null = null;

  connect(token: string, onEvent: (event: OperatorEvent) => void): void {
    this.disconnect();
    const ws = new WebSocket(
      `${WS_BASE_URL}/api/v1/coordination/operator?token=${token}`,
    );
    this.ws = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as {
        event: string;
        payload?: unknown;
      };
      const payload = (msg.payload ?? {}) as Record<string, unknown>;

      switch (msg.event) {
        // Backend sends one USER_GREET per queued emergency on operator connect.
        case "USER_GREET": {
          onEvent({ type: "queue_emergency", emergency: toOperatorEmergency(payload) });
          break;
        }
        case "EMERGENCY_RECEIVED":
          onEvent({ type: "emergency_received", emergency: toOperatorEmergency(payload) });
          break;
        case "EMERGENCY_TAKEN":
          onEvent({ type: "emergency_taken", emergencyId: (msg.payload ?? "") as string });
          break;
        case "EMERGENCY_TRIAGED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "emergency_triaged", emergencyId: em.id, emergency: em });
          break;
        }
        case "EMERGENCY_ASSIGNED": {
          const em = toOperatorEmergency(payload);
          const paramedicId = (em.assignedTo?.id ?? "") as string;
          onEvent({ type: "emergency_assigned", emergencyId: em.id, paramedicId, emergency: em });
          break;
        }
        case "EMERGENCY_ARRIVED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "emergency_arrived", emergencyId: em.id, emergency: em });
          break;
        }
        case "EMERGENCY_COMPLEXITY_ASSIGNED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "emergency_complexity_assigned", emergencyId: em.id, emergency: em });
          break;
        }
        case "EMERGENCY_TRANSFERRED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "emergency_transferred", emergencyId: em.id, emergency: em });
          break;
        }
        case "EMERGENCY_RESOLVED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "emergency_resolved", emergencyId: em.id, emergency: em });
          break;
        }
        case "EMERGENCY_CLOSED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "emergency_closed", emergencyId: em.id, emergency: em });
          break;
        }
        case "EMERGENCY_CANCELED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "emergency_canceled", emergencyId: em.id, emergency: em });
          break;
        }
        case "EMERGENCY_ASSIGNMENT_CANCELED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "assignment_canceled", emergencyId: em.id, emergency: em });
          break;
        }
        case "ALERT_EDITED": {
          onEvent({ type: "alert_edited", emergency: toOperatorEmergency(payload) });
          break;
        }
        case "ERROR":
          onEvent({
            type: "error",
            message: typeof msg.payload === "string" ? msg.payload : String(msg.payload ?? "Unknown error"),
          });
          break;
      }
    };

    ws.onerror = (e) => console.warn("Operator coordination WS error", e);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  triageEmergency(emergencyId: string, triage: TriageData): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        command: "TRIAGE_EMERGENCY",
        payload: { emergencyId, triage },
      }),
    );
  }

  assignParamedic(emergencyId: string, paramedicId: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        command: "REQUEST_EMERGENCY_ASSIGNMENT",
        payload: { emergencyId, paramedicId },
      }),
    );
  }

  subscribeToEmergency(emergencyId: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ command: "SUBSCRIBE", payload: emergencyId }));
  }

  cancelEmergency(emergencyId: string, reason: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        command: "CANCEL_EMERGENCY",
        payload: { emergencyId, reason },
      }),
    );
  }

  closeEmergency(emergencyId: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ command: "CLOSE_EMERGENCY", payload: emergencyId }));
  }

  editAlert(emergencyId: string, location: GeoLocation | null): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        command: "EDIT_ALERT",
        payload: { emergencyId, location, medicalInfo: null },
      }),
    );
  }
}
