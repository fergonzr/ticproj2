// Defines what the app can do, without saying how. 
// Every operation is a TypeScript interface:

// EmergencyUpdateListener — citizen reports emergency, 
// gets status updates

// EmergencyAssignmentListener — paramedic listens for assignments, 
// accepts, reports arrival

// ParamedicLocationTracker — paramedic sends GPS location
// OperatorAuthenticator / OperatorService — operator logs in, 
// triages, assigns

// This is why you can swap real vs mock 
// without touching any screen code.

import {
  Alert,
  EmergencyCase,
  EmergencyAssignment,
  CaseReport,
  ParamedicUser,
  OperatorUser,
  GeoLocation,
  RouteInfo,
  PQRSSubmission,
  ComplexityLevel,
  MedicalCenter,
  MedicalInfo,
  PrehospitalCareReportData,
  TriageData,
} from "../models";

/**
 * A listener for changes on the current EmergencyCase
 */
export interface EmergencyUpdateListener {
  /**
   *
   * @param alert The Alert object to report the emergency.
   * @param onStatusChange A callback to handle changes on the
   * resultant EmergencyCase.
   * @returns A promise that is fulfilled once the system processes
   * the alert and generates a proper corresponding EmergencyCase.
   */
  reportEmergency(
    alert: Alert,
    onStatusChange: (emergencyCase: EmergencyCase) => void,
  ): Promise<EmergencyCase>;

  /**
   * Cancels the active emergency reported by this citizen.
   * @param emergencyId The ID of the emergency to cancel.
   * @param reason Optional reason for cancellation.
   */
  cancelEmergency(emergencyId: string, reason: string): void;
}

/**
 * Interface for submitting a paramedic's case report
 */
export interface CaseReportSubmitter {
  /**
   * Submits the completed case report for an emergency.
   * @param report The full CaseReport object filled by the paramedic.
   * @returns A promise that resolves when the report is successfully submitted.
   */
  submitReport(report: CaseReport): Promise<void>;
}

export interface ParamedicAuthenticator {
  /**
   * Handles paramedic login with the given credentials..
   * @param email The paramedic's email address.
   * @param password The paramedic's password.
   * @returns A promise that resolves when login is successful, or rejects on failure.
   */
  login(email: string, password: string): Promise<ParamedicUser>;
}

/**
 * Listens for emergency assignments offered to a paramedic
 */
export interface EmergencyAssignmentListener {
  /**
   * Starts polling/subscribing for new assignments.
   * @param paramedicId The ID of the paramedic to listen for.
   * @param onNewAssignment Callback invoked when a new assignment is offered.
   */
  startListening(
    paramedicId: string,
    onNewAssignment: (assignment: EmergencyAssignment) => void,
    onError?: (reason: "auth_error" | "connection_error") => void,
  ): void;

  /** Stops polling/subscribing for assignments. */
  stopListening(): void;

  /**
   * Accepts an offered assignment.
   * @param assignmentId The ID of the assignment to accept.
   * @returns The confirmed EmergencyCase.
   */
  acceptAssignment(assignmentId: string): Promise<EmergencyCase>;

  /**
   * Rejects an offered assignment.
   * @param assignmentId The ID of the assignment to reject.
   */
  rejectAssignment(assignmentId: string): Promise<void>;

  /**
   * Cancels the active assignment, releasing the paramedic from the case.
   * The emergency stays alive and returns to unassigned state.
   * @param reason The reason for abandoning the case.
   */
  cancelAssignment(reason: string): void;

  /**
   * Reports that the paramedic has arrived at the emergency site.
   * Sends the arrival command through the open coordination WebSocket.
   */
  reportArrival(): Promise<void>;

  /**
   * Assigns a complexity level to the active emergency.
   * Must be called after arrival; required before transferring to a medical center.
   */
  assignComplexity(level: ComplexityLevel): Promise<void>;

  /**
   * Fetches medical centers compatible with the active emergency's complexity level.
   * @param emergencyId The id of the active emergency.
   */
  getMedicalCenterRecommendations(emergencyId: string): Promise<MedicalCenter[]>;

  /**
   * Transfers the active emergency to a medical center.
   * Requires a complexity level to be set first.
   */
  transferEmergency(medicalCenterId: string): Promise<void>;

  /**
   * Submits a prehospital care report to the receiving medical center.
   * Requires the emergency to be in IN_TRANSFER status.
   */
  reportPrehospitalCare(data: PrehospitalCareReportData): Promise<void>;

  /**
   * Marks the active emergency as resolved (final paramedic step).
   */
  markResolved(): Promise<void>;

  /**
   * Registers a callback for ERROR events received on the coordination WebSocket.
   * Used to surface backend rejections (invalid state transitions, etc.) to the UI.
   */
  setOnCoordinationError(cb: ((message: string) => void) | null): void;

  /**
   * Registers a callback fired when the active emergency is canceled externally
   * (by the operator or the citizen), so the paramedic UI can reset to idle.
   * Pass null to clear.
   */
  setOnEmergencyCanceled(cb: (() => void) | null): void;
}

/**
 * Provides route information between two locations
 */
export interface RouteProvider {
  /**
   * Gets a route between two geographic points.
   * @param from Origin location.
   * @param to Destination location.
   * @returns Route information including polyline, ETA, and distance.
   */
  getRoute(from: GeoLocation, to: GeoLocation): Promise<RouteInfo>;
}

/**
 * Interface for tracking paramedic location and sending updates to the server
 */
export interface ParamedicLocationTracker {
  /**
   * Reports paramedic location to the server
   * @param paramedicId The ID of the paramedic
   * @param location The current location of the paramedic
   * @returns Promise that resolves when the location update is successfully sent
   */
  reportLocation(paramedicId: string, location: GeoLocation): Promise<void>;
}

/**
 * Interface for submitting PQRS submissions
 */
export interface PQRSSubmissionSubmitter {
  /**
   * Submits a PQRS submission to the server
   * @param submission The PQRSSubmission to submit
   * @returns Promise that resolves when the submission is successfully sent
   */
  submitPQRS(submission: PQRSSubmission): Promise<void>;
}

// --- Operator interfaces ---

export interface OperatorAuthenticator {
  /**
   * Handles operator login with the given credentials.
   * @param email The operator's email address.
   * @param password The operator's password.
   * @returns A promise that resolves when login is successful, or rejects on failure.
   */
  login(email: string, password: string): Promise<OperatorUser>;
}

/** Triage data sent by the operator to classify an emergency. */
export type { TriageData };

/** A minimal emergency record as seen by the operator. */
export type OperatorEmergency = {
  id: string;
  filingNumber: number;
  location: GeoLocation;
  /** Patient data when the citizen reported with a registered profile.
   *  `null` for third-party reports or when the citizen had no medical info. */
  medicalInfo: MedicalInfo | null;
  state: string;
  reportedOn: string;
  assignedTo: { id: string; name: string } | null;
  operatedBy: { id: string; name: string } | null;
  triage: TriageData | null;
  complexityLevel: number | null;
  cancelReason: string | null;
  transferedTo: { id: string; name: string } | null;
  prehospitalCareReportSent: boolean;
  timeline: Record<string, string>;
};

/**
 * Renders the patient's full name from the operator emergency's medicalInfo,
 * falling back to a generic label when no profile was attached.
 */
export function formatPatientName(emergency: { medicalInfo: MedicalInfo | null }): string {
  const m = emergency.medicalInfo;
  if (!m) return "Paciente desconocido";
  const full = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
  return full.length > 0 ? full : "Paciente desconocido";
}

/** Union of all events the operator WebSocket can emit. */
export type OperatorEvent =
  | { type: "initial_queue"; emergencies: OperatorEmergency[] }
  | { type: "queue_emergency"; emergency: OperatorEmergency }
  | { type: "emergency_received"; emergency: OperatorEmergency }
  | { type: "emergency_operated"; emergency: OperatorEmergency }
  | { type: "operated_greet"; emergency: OperatorEmergency }
  | { type: "emergency_taken"; emergencyId: string }
  | { type: "emergency_triaged"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "emergency_assigned"; emergencyId: string; paramedicId: string; emergency: OperatorEmergency }
  | { type: "emergency_arrived"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "emergency_complexity_assigned"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "emergency_transferred"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "emergency_resolved"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "prehospital_care_reported"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "emergency_closed"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "emergency_canceled"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "assignment_canceled"; emergencyId: string; emergency: OperatorEmergency }
  | { type: "alert_edited"; emergency: OperatorEmergency }
  | { type: "error"; message: string };

export interface OperatorService {
  connect(token: string, onEvent: (event: OperatorEvent) => void): void;
  disconnect(): void;
  triageEmergency(emergencyId: string, triage: TriageData): void;
  assignParamedic(emergencyId: string, paramedicId: string): void;
  /** Subscribes the operator to a specific emergency (sends SUBSCRIBE command). */
  subscribeToEmergency(emergencyId: string): void;
  /** Cancels an emergency with a required reason. */
  cancelEmergency(emergencyId: string, reason: string): void;
  /** Closes a resolved emergency. */
  closeEmergency(emergencyId: string): void;
  /** Edits the alert location / medical info for an emergency. */
  editAlert(emergencyId: string, location: GeoLocation | null): void;
}
