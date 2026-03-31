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

// Converts a SafeEmergency payload from the coordinator into OperatorEmergency.
function toOperatorEmergency(payload: Record<string, unknown>): OperatorEmergency {
  const alert = (payload.alert as Record<string, unknown> | undefined) ?? {};
  const loc = (alert.location as Record<string, number> | undefined) ?? {};
  return {
    id: (payload.id ?? "") as string,
    location: {
      latitude: (loc.latitude ?? 0) as number,
      longitude: (loc.longitude ?? 0) as number,
    },
    medicalInfo: (alert.medicalInfo ?? "") as string,
    state: (payload.status ?? "RECEIVED") as string,
    reportedOn: (alert.generatedOn ?? new Date().toISOString()) as string,
  };
}

// Converts a SafeEmergency payload from the coordinator into EmergencyCase.
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


async function fetchToken(
  email: string,
  password: string,
  role: string,
): Promise<string> {
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
): Promise<{ id: string; email: string; name: string }> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/whoami`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new InvalidCredentialsError();
  return response.json() as Promise<{ id: string; email: string; name: string }>;
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
    const token = await fetchToken(email, password, "OPERATOR");
    const profile = await fetchUserProfile(token);
    return { id: profile.id, email: profile.email, name: profile.name, token };
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

// --- Paramedic tracker + assignment listener (single class for shared WS) ---

/**
 * Implements both ParamedicLocationTracker and EmergencyAssignmentListener
 * using a single location-tracker WebSocket for both GPS updates and assignment
 * notifications, plus a second coordination WebSocket opened on assignment acceptance.
 */
export class RealParamedicTrackerAndListener
  implements ParamedicLocationTracker, EmergencyAssignmentListener
{
  private token: string;
  private locationWs: WebSocket | null = null;
  private coordinationWs: WebSocket | null = null;

  constructor(token: string) {
    this.token = token;
  }

  // --- ParamedicLocationTracker ---

  async reportLocation(_paramedicId: string, location: GeoLocation): Promise<void> {
    if (this.locationWs?.readyState !== WebSocket.OPEN) return;
    this.locationWs.send(
      JSON.stringify({
        command: "update_location",
        payload: { lat: location.latitude, lng: location.longitude },
      }),
    );
    // Fire-and-forget: the backend does not respond to location updates.
  }

  // --- EmergencyAssignmentListener ---

  startListening(
    _paramedicId: string,
    onNewAssignment: (assignment: EmergencyAssignment) => void,
  ): void {
    this.stopListening();
    const ws = new WebSocket(
      `${WS_BASE_URL}/api/v1/locationTracker?token=${this.token}`,
    );
    this.locationWs = ws;

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

    ws.onerror = (e) => console.warn("Location tracker WS error", e);
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
        payload?: Record<string, unknown>;
      };
      const payload = msg.payload ?? {};

      switch (msg.event) {
        case "USER_GREET": {
          const list = (payload.emergencies ?? []) as Record<string, unknown>[];
          onEvent({ type: "initial_queue", emergencies: list.map(toOperatorEmergency) });
          break;
        }
        case "EMERGENCY_RECEIVED":
          onEvent({ type: "emergency_received", emergency: toOperatorEmergency(payload) });
          break;
        case "EMERGENCY_TRIAGED":
          onEvent({
            type: "emergency_triaged",
            emergencyId: (payload.id ?? "") as string,
          });
          break;
        case "EMERGENCY_ASSIGNED":
          onEvent({
            type: "emergency_assigned",
            emergencyId: (payload.id ?? "") as string,
            paramedicId: ((payload.assignedTo as Record<string, unknown> | undefined)?.id ?? "") as string,
          });
          break;
        case "EMERGENCY_ARRIVED":
          onEvent({
            type: "emergency_arrived",
            emergencyId: (payload.id ?? "") as string,
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
}
