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
  RouteProvider,
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
  RouteInfo,
  ComplexityLevel,
  MedicalCenter,
  PrehospitalCareReportData,
} from "../models";
import { InvalidCredentialsError, AssignmentAcceptError } from "./errors";

// --- Shared helpers ---

/**
 * Maps the mobile `MedicalInfo` shape to the payload the backend expects.
 * Drops `dataConsent` (mobile-only consent flag) and normalizes nullable
 * `hasPacemaker` to a concrete boolean since the backend dataclass requires it.
 */
/**
 * Parses a `medicalInfo` field coming back from the operator stream.
 * The backend may send a full MedicalInfo dict, null (third-party report),
 * or — for legacy payloads — an empty string. Returns null when there is
 * no usable data so consumers can render a "patient unknown" fallback.
 */
function parseOperatorMedicalInfo(raw: unknown): MedicalInfo | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const firstName = typeof o.firstName === "string" ? o.firstName : "";
  const lastName = typeof o.lastName === "string" ? o.lastName : "";
  if (!firstName && !lastName) return null;
  return {
    firstName,
    lastName,
    phone: typeof o.phone === "string" ? o.phone : "",
    documentType: typeof o.documentType === "string" ? o.documentType : "NATIONAL_ID",
    documentNumber: typeof o.documentNumber === "string" ? o.documentNumber : "",
    age: typeof o.age === "string" ? o.age : "",
    allergies: Array.isArray(o.allergies) ? (o.allergies as string[]) : [],
    diseases: Array.isArray(o.diseases) ? (o.diseases as string[]) : [],
    hasPacemaker: typeof o.hasPacemaker === "boolean" ? o.hasPacemaker : null,
    bloodType: typeof o.bloodType === "string" ? o.bloodType : "O_POSITIVE",
    dataConsent: null,
  };
}

/** Parses a `triage` field (8-symptom dict) coming from the backend. */
function parseTriage(raw: unknown): TriageData | null {
  if (raw === null || raw === undefined || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  return {
    bleeding: t.bleeding === true,
    dizziness: t.dizziness === true,
    blurred_vision: t.blurred_vision === true,
    unconscious: t.unconscious === true,
    difficulty_breathing: t.difficulty_breathing === true,
    fracture: t.fracture === true,
    chest_pain: t.chest_pain === true,
    numbness_limbs: t.numbness_limbs === true,
  };
}

/** Parses a `complexityLevel` field — the backend may send a number or enum name. */
function parseComplexityLevel(raw: unknown): ComplexityLevel | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return raw as ComplexityLevel;
  if (typeof raw === "string") {
    const byName = ComplexityLevel[raw as keyof typeof ComplexityLevel];
    return typeof byName === "number" ? byName : null;
  }
  return null;
}

function serializeMedicalInfo(info: MedicalInfo | null): Record<string, unknown> | null {
  if (info === null) return null;
  return {
    firstName: info.firstName,
    lastName: info.lastName,
    phone: info.phone,
    documentType: info.documentType,
    documentNumber: info.documentNumber,
    age: info.age,
    bloodType: info.bloodType,
    allergies: info.allergies,
    diseases: info.diseases,
    hasPacemaker: info.hasPacemaker === true,
  };
}

/** Parses an incident location, treating a missing/invalid coordinate — and the
 *  literal `0,0` (Gulf of Guinea, never a real Envigado emergency) — as "not
 *  captured" so consumers can render it as unavailable instead of a fake point. */
function parseIncidentLocation(raw: unknown): GeoLocation | null {
  const loc = raw as Record<string, number> | undefined;
  if (!loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number") {
    return null;
  }
  if (loc.latitude === 0 && loc.longitude === 0) return null;
  return { latitude: loc.latitude, longitude: loc.longitude };
}

function toOperatorEmergency(payload: Record<string, unknown>): OperatorEmergency {
  const alert = (payload.alert as Record<string, unknown> | undefined) ?? {};
  const assignedTo = (payload.assignedTo as Record<string, unknown> | undefined) ?? null;
  const operatedBy = (payload.operatedBy as Record<string, unknown> | undefined) ?? null;
  const transferedTo = (payload.transferedTo as Record<string, unknown> | undefined) ?? null;
  const triage = parseTriage(payload.triage);
  return {
    id: (payload.id ?? "") as string,
    filingNumber: (payload.filingNumber ?? 0) as number,
    location: parseIncidentLocation(alert.location),
    medicalInfo: parseOperatorMedicalInfo(alert.medicalInfo),
    state: (payload.status ?? "RECEIVED") as string,
    reportedOn: (alert.generatedOn ?? new Date().toISOString()) as string,
    assignedTo: assignedTo
      ? { id: (assignedTo.id ?? "") as string, name: (assignedTo.name ?? "") as string }
      : null,
    operatedBy: operatedBy
      ? { id: (operatedBy.id ?? "") as string, name: (operatedBy.name ?? "") as string }
      : null,
    triage,
    complexityLevel: (payload.complexityLevel ?? null) as number | null,
    cancelReason: (payload.cancelReason ?? null) as string | null,
    transferedTo: transferedTo
      ? {
          id: (transferedTo.id ?? "") as string,
          name: (transferedTo.name ?? "") as string,
          location: (() => {
            const loc = transferedTo.location as Record<string, number> | undefined;
            if (!loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return null;
            return { latitude: loc.latitude, longitude: loc.longitude };
          })(),
        }
      : null,
    prehospitalCareReportSent: Boolean(payload.prehospitalCareReportSent ?? false),
    timeline: (payload.timeline ?? {}) as Record<string, string>,
  };
}

const FALLBACK_PATIENT: MedicalInfo = {
  firstName: "Paciente",
  lastName: "desconocido",
  phone: "",
  documentType: "NATIONAL_ID",
  documentNumber: "",
  age: "",
  allergies: [],
  diseases: [],
  hasPacemaker: null,
  bloodType: "O_POSITIVE",
  dataConsent: null,
};

export function buildEmergencyCase(payload: Record<string, unknown>): EmergencyCase {
  const alert = (payload.alert as Record<string, unknown> | undefined) ?? {};
  const loc = (alert.location as Record<string, number> | undefined) ?? {};
  const location: GeoLocation = {
    latitude: (loc.latitude ?? 0) as number,
    longitude: (loc.longitude ?? 0) as number,
  };

  const medicalInfo: MedicalInfo =
    parseOperatorMedicalInfo(alert.medicalInfo) ?? FALLBACK_PATIENT;

  return {
    id: payload.id as string | undefined,
    filingNumber:
      typeof payload.filingNumber === "number" ? payload.filingNumber : undefined,
    reportedOn: new Date((alert.generatedOn as string | undefined) ?? Date.now()),
    medicalInfo,
    location,
    emergencyState: EmergencyStatus.RECEIVED,
    triage: parseTriage(payload.triage),
    complexityLevel: parseComplexityLevel(payload.complexityLevel),
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

export class RealRouteProvider implements RouteProvider {
  constructor(private readonly token: string) {}

  async getRoute(from: GeoLocation, to: GeoLocation): Promise<RouteInfo> {
    const params = new URLSearchParams({
      from_lat: String(from.latitude),
      from_lon: String(from.longitude),
      to_lat: String(to.latitude),
      to_lon: String(to.longitude),
    });
    const response = await fetch(`${BASE_URL}/api/v1/routing?${params}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error("Routing service unavailable");
    const data = (await response.json()) as {
      points: [number, number][];
      distance_m: number;
      time_ms: number;
    };
    return {
      // Backend returns [lon, lat] pairs — swap to {latitude, longitude}.
      points: data.points.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
      estimatedMinutes: Math.round(data.time_ms / 60000),
      distanceKm: Math.round((data.distance_m / 1000) * 10) / 10,
      destinationLabel: "",
    };
  }
}

export class RealOperatorAuthenticator implements OperatorAuthenticator {
  async login(email: string, password: string): Promise<OperatorUser> {
    const token = await fetchToken(email, password, "OPERATOR");
    const profile = await fetchUserProfile(token);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      token,
      userRole: profile.userRole ?? "OPERATOR",
    };
  }
}

// --- Citizen emergency listener ---

export class RealEmergencyUpdateListener implements EmergencyUpdateListener {
  private citizenWs: WebSocket | null = null;

  async reportEmergency(
    alert: Alert,
    onStatusChange: (emergencyCase: EmergencyCase) => void,
  ): Promise<EmergencyCase> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_BASE_URL}/api/v1/coordination/citizen`);
      this.citizenWs = ws;
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
              medicalInfo: serializeMedicalInfo(alert.medicalInfo),
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
        } else if (msg.event === "EMERGENCY_ASSIGNMENT_CANCELED") {
          newState = EmergencyStatus.DISPATCHED;
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

  cancelEmergency(emergencyId: string, reason: string): void {
    if (this.citizenWs?.readyState !== WebSocket.OPEN) return;
    this.citizenWs.send(
      JSON.stringify({
        command: "CANCEL_EMERGENCY",
        payload: { emergencyId, reason: reason || null },
      }),
    );
  }

  async subscribeToEmergency(
    emergencyId: string,
    onStatusChange: (emergencyCase: EmergencyCase) => void,
  ): Promise<EmergencyCase> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_BASE_URL}/api/v1/coordination/citizen`);
      this.citizenWs = ws;
      let storedCase: EmergencyCase | null = null;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            command: "SUBSCRIBE",
            payload: emergencyId,
          }),
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string) as {
          event: string;
          payload?: Record<string, unknown>;
        };

        if (msg.event === "USER_GREET_EMERGENCY") {
          const payload = msg.payload ?? {};
          storedCase = buildEmergencyCase(payload);

          // Map the state string from the server to the EmergencyStatus enum.
          // The backend may send "RESOLVED" which we treat the same as CLOSED.
          const stateStr = (payload.state as string) ?? "RECEIVED";
          if (stateStr === "RESOLVED") {
            storedCase.emergencyState = EmergencyStatus.CLOSED;
          } else {
            const mapped = EmergencyStatus[stateStr as keyof typeof EmergencyStatus];
            if (mapped !== undefined) {
              storedCase.emergencyState = mapped;
            }
          }

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
        } else if (msg.event === "EMERGENCY_ASSIGNMENT_CANCELED") {
          newState = EmergencyStatus.DISPATCHED;
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
  private _listening = false;
  private _onCoordinationError: ((message: string) => void) | null = null;
  private _onEmergencyCanceled: (() => void) | null = null;
  /** Holds the most recent location received before the WS is OPEN, so it
   *  can be flushed as the first UPDATE_LOCATION as soon as the WS connects.
   *  Without this, the backend creates the paramedic without `resource` and
   *  the operator hits "no active user with that id was found". */
  private _pendingLocation: GeoLocation | null = null;

  constructor(token: string) {
    this.token = token;
  }

  async reportLocation(_paramedicId: string, location: GeoLocation): Promise<void> {
    if (this.locationWs?.readyState !== WebSocket.OPEN) {
      this._pendingLocation = location;
      return;
    }
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
    this._listening = true;
    this._connectLocationWs(onNewAssignment, onError);
  }

  private _connectLocationWs(
    onNewAssignment: (assignment: EmergencyAssignment) => void,
    onError?: (reason: "auth_error" | "connection_error") => void,
  ): void {
    const ws = new WebSocket(
      `${WS_BASE_URL}/api/v1/locationTracker?token=${this.token}`,
    );
    this.locationWs = ws;

    ws.onopen = () => {
      console.log("[locationTracker] WS connected");
      if (this._pendingLocation) {
        ws.send(
          JSON.stringify({
            command: "UPDATE_LOCATION",
            payload: {
              latitude: this._pendingLocation.latitude,
              longitude: this._pendingLocation.longitude,
            },
          }),
        );
        this._pendingLocation = null;
      }
    };
    ws.onclose = (e) => {
      console.warn("[locationTracker] WS closed", e.code, e.reason);
      const isAuthError = e.code === 4003 || e.code === 4001 ||
        e.reason?.includes("403") || e.reason?.includes("401");
      if (isAuthError) {
        onError?.("auth_error");
      } else if (e.code !== 1000 && this._listening) {
        console.log("[locationTracker] reconnecting in 3s…");
        setTimeout(() => {
          if (this._listening) this._connectLocationWs(onNewAssignment, onError);
        }, 3000);
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
    this._listening = false;
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

      let resolved = false;

      // Persistent message handler — survives past EMERGENCY_ASSIGNED so we
      // can surface ERROR events for any subsequent command (assign complexity,
      // transfer, prehospital care, mark resolved).
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string) as {
          event: string;
          payload?: unknown;
        };
        if (msg.event === "EMERGENCY_ASSIGNED") {
          resolved = true;
          clearTimeout(timeout);
          resolve(buildEmergencyCase((msg.payload ?? {}) as Record<string, unknown>));
          return;
        }
        if (msg.event === "ERROR") {
          const message =
            typeof msg.payload === "string" ? msg.payload : String(msg.payload ?? "Error");
          // If the promise hasn't resolved yet, an ERROR during the handshake
          // means the backend rejected the assignment — reject immediately.
          if (!resolved) {
            clearTimeout(timeout);
            reject(new AssignmentAcceptError());
          } else {
            this._onCoordinationError?.(message);
          }
        }
        if (msg.event === "EMERGENCY_CANCELED") {
          this._onEmergencyCanceled?.();
        }
      };

      ws.onclose = (e) => {
        if (!resolved) {
          console.warn("[coordination] WS closed before EMERGENCY_ASSIGNED", e.code, e.reason);
          clearTimeout(timeout);
          reject(new AssignmentAcceptError());
        }
      };

      ws.onerror = (e) => {
        console.warn("[coordination] WS error", e);
        clearTimeout(timeout);
        reject(new AssignmentAcceptError());
      };
    });
  }

  setOnCoordinationError(cb: ((message: string) => void) | null): void {
    this._onCoordinationError = cb;
  }

  setOnEmergencyCanceled(cb: (() => void) | null): void {
    this._onEmergencyCanceled = cb;
  }

  async rejectAssignment(_assignmentId: string): Promise<void> {
    // The backend has no explicit reject command; not connecting is sufficient.
  }

  cancelAssignment(reason: string): void {
    if (this.coordinationWs?.readyState !== WebSocket.OPEN) return;
    this.coordinationWs.send(
      JSON.stringify({ command: "CANCEL_ASSIGNMENT", payload: { reason } }),
    );
  }

  async reportArrival(): Promise<void> {
    if (this.coordinationWs?.readyState !== WebSocket.OPEN) return;
    this.coordinationWs.send(
      JSON.stringify({ command: "ANNOUNCE_ARRIVAL", payload: null }),
    );
  }

  async assignComplexity(level: ComplexityLevel): Promise<void> {
    if (this.coordinationWs?.readyState !== WebSocket.OPEN)
      throw new Error("Coordination WS not open");
    this.coordinationWs.send(
      JSON.stringify({ command: "ASSIGN_COMPLEXITY_LEVEL", payload: level }),
    );
  }

  async getMedicalCenterRecommendations(emergencyId: string): Promise<MedicalCenter[]> {
    const response = await fetch(
      `${BASE_URL}/api/v1/medicalCenterRecommendation/${emergencyId}`,
      { headers: { Authorization: `Bearer ${this.token}` } },
    );
    if (!response.ok) throw new Error(`Medical center fetch failed: ${response.status}`);
    const raw = (await response.json()) as Array<Record<string, unknown>>;
    return raw.map((mc) => {
      const loc = (mc.location as Record<string, number> | undefined) ?? {};
      const rawComplexity = mc.maxComplexityLevel as number | string;
      const complexity =
        typeof rawComplexity === "string"
          ? ComplexityLevel[rawComplexity as keyof typeof ComplexityLevel]
          : (rawComplexity as ComplexityLevel);
      return {
        id: mc.id as string,
        name: mc.name as string,
        phone: (mc.phone ?? "") as string,
        maxComplexityLevel: complexity,
        specialties: (mc.specialties ?? []) as string[],
        availableSlots: (mc.availableSlots ?? null) as number | null,
        location: {
          latitude: (loc.latitude ?? 0) as number,
          longitude: (loc.longitude ?? 0) as number,
        },
      };
    });
  }

  async transferEmergency(medicalCenterId: string): Promise<void> {
    if (this.coordinationWs?.readyState !== WebSocket.OPEN)
      throw new Error("Coordination WS not open");
    this.coordinationWs.send(
      JSON.stringify({ command: "TRANSFER_EMERGENCY", payload: medicalCenterId }),
    );
  }

  async reportPrehospitalCare(data: PrehospitalCareReportData): Promise<void> {
    if (this.coordinationWs?.readyState !== WebSocket.OPEN)
      throw new Error("Coordination WS not open");
    this.coordinationWs.send(
      JSON.stringify({
        command: "REPORT_PREHOSPITAL_CARE",
        payload: {
          initialStateDescription: data.initialStateDescription,
          treatmentDescription: data.treatmentDescription,
          finalState: data.finalState,
          finalStateDescription: data.finalStateDescription,
        },
      }),
    );
  }

  async markResolved(): Promise<void> {
    if (this.coordinationWs?.readyState !== WebSocket.OPEN)
      throw new Error("Coordination WS not open");
    this.coordinationWs.send(
      JSON.stringify({ command: "MARK_EMERGENCY_RESOLVED", payload: null }),
    );
  }
}

// --- Operator service ---

export class RealOperatorService implements OperatorService {
  private ws: WebSocket | null = null;
  private _token: string | null = null;
  private _onEvent: ((event: OperatorEvent) => void) | null = null;
  private _intentionalClose = false;
  private _reconnectAttempts = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(token: string, onEvent: (event: OperatorEvent) => void): void {
    this.disconnect();
    this._token = token;
    this._onEvent = onEvent;
    this._intentionalClose = false;
    this._reconnectAttempts = 0;
    this._openSocket();
  }

  /**
   * Opens the coordination WebSocket and wires auto-reconnect. On an
   * unintentional close it retries with exponential backoff (1s→15s); the
   * backend re-greets the queue and owned emergencies on reconnect, so
   * state re-syncs without a manual page reload.
   */
  private _openSocket(): void {
    const token = this._token;
    const onEvent = this._onEvent;
    if (!token || !onEvent) return;

    const ws = new WebSocket(
      `${WS_BASE_URL}/api/v1/coordination/operator?token=${token}`,
    );
    this.ws = ws;

    ws.onopen = () => {
      this._reconnectAttempts = 0;
    };

    ws.onclose = (e) => {
      if (this._intentionalClose) return;
      const delay = Math.min(1000 * 2 ** this._reconnectAttempts, 15000);
      this._reconnectAttempts += 1;
      console.warn(
        `[operator] coordination WS closed (code ${e.code}) — reconnecting in ${delay}ms`,
      );
      this._reconnectTimer = setTimeout(() => this._openSocket(), delay);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as {
        event: string;
        payload?: unknown;
      };
      const payload = (msg.payload ?? {}) as Record<string, unknown>;

      switch (msg.event) {
        // Backend sends one USER_GREET per queued (unowned) emergency on operator connect.
        case "USER_GREET": {
          onEvent({ type: "queue_emergency", emergency: toOperatorEmergency(payload) });
          break;
        }
        // Backend sends one USER_GREET_EMERGENCY per emergency this operator already
        // owns (operatedBy = this user) — restores myAlerts after a reconnect.
        case "USER_GREET_EMERGENCY": {
          onEvent({ type: "operated_greet", emergency: toOperatorEmergency(payload) });
          break;
        }
        case "EMERGENCY_RECEIVED":
          onEvent({ type: "emergency_received", emergency: toOperatorEmergency(payload) });
          break;
        // The operator who just took the emergency receives the full updated
        // SafeEmergency (status=TAKEN, operatedBy set).
        case "EMERGENCY_OPERATED":
          onEvent({ type: "emergency_operated", emergency: toOperatorEmergency(payload) });
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
        case "PREHOSPITAL_CARE_REPORTED": {
          const em = toOperatorEmergency(payload);
          onEvent({ type: "prehospital_care_reported", emergencyId: em.id, emergency: em });
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
    this._intentionalClose = true;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
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

  editAlert(
    emergencyId: string,
    location: GeoLocation | null,
    medicalInfo: MedicalInfo | null,
  ): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        command: "EDIT_ALERT",
        payload: {
          emergencyId,
          location,
          medicalInfo: serializeMedicalInfo(medicalInfo),
        },
      }),
    );
  }
}

// --- Operator-side paramedic location watcher ---

/**
 * Subscribes to one or more paramedics' real-time GPS feeds.
 *
 * Opens a single watch WebSocket against the location-updater service and
 * routes incoming `LOCATION_UPDATED` events to per-paramedic callbacks.
 * Used by the operator dashboard so it can render the paramedic's marker
 * and recompute the route as they move.
 */
export class RealParamedicLocationWatcher {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, (loc: GeoLocation) => void>();
  private pendingSubscribes: string[] = [];

  constructor(private readonly token: string) {}

  private ensureConnection(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) return;

    const url = `${WS_BASE_URL}/api/v1/locationTracker/watch?token=${this.token}`;
    console.log("[locationTracker/watch] opening WS", url);
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      console.log("[locationTracker/watch] WS open — flushing", this.pendingSubscribes.length, "pending SUBSCRIBE(s)");
      for (const id of this.pendingSubscribes) {
        ws.send(JSON.stringify({ command: "SUBSCRIBE", payload: id }));
      }
      this.pendingSubscribes = [];
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          event: string;
          payload?: { paramedicId?: string; location?: { latitude?: number; longitude?: number } };
        };
        console.log("[locationTracker/watch] event", msg.event, msg.payload);
        if (msg.event !== "LOCATION_UPDATED") return;
        const p = msg.payload;
        if (!p?.paramedicId || !p.location) return;
        const cb = this.subscriptions.get(p.paramedicId);
        if (!cb) {
          console.warn("[locationTracker/watch] no subscription for", p.paramedicId, "(known:", [...this.subscriptions.keys()], ")");
          return;
        }
        cb({
          latitude: (p.location.latitude ?? 0) as number,
          longitude: (p.location.longitude ?? 0) as number,
        });
      } catch (e) {
        console.warn("[locationTracker/watch] parse error", e);
      }
    };

    ws.onclose = (e) => {
      console.warn("[locationTracker/watch] WS closed", e.code, e.reason);
      this.ws = null;
    };

    ws.onerror = (e) => console.warn("[locationTracker/watch] WS error", e);
  }

  subscribe(paramedicId: string, onLocation: (loc: GeoLocation) => void): void {
    console.log("[locationTracker/watch] subscribe", paramedicId);
    this.subscriptions.set(paramedicId, onLocation);
    this.ensureConnection();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command: "SUBSCRIBE", payload: paramedicId }));
    } else {
      this.pendingSubscribes.push(paramedicId);
    }
  }

  unsubscribe(paramedicId: string): void {
    this.subscriptions.delete(paramedicId);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command: "UNSUBSCRIBE", payload: paramedicId }));
    }
  }

  disconnect(): void {
    this.subscriptions.clear();
    this.pendingSubscribes = [];
    this.ws?.close();
    this.ws = null;
  }
}
