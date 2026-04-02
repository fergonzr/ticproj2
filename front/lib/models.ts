export const DOCUMENT_TYPES: Record<string, string> = {
  NATIONAL_ID: "Cedula",
  PASSPORT: "Pasaporte",
  IDENTITY_CARD: "Tarjeta de identidad",
};

export const BLOOD_TYPES: Record<string, string> = {
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
};

export const ALLERGY_SUGGESTIONS: string[] = [
  "Ninguna",
  "Rinitis",
  "Asma",
  "Dermatitis",
  "Látex",
  "Polvo",
  "Polen",
  "Ácaros",
  "Mariscos",
  "Gluten",
  "Abejas",
  "Penicilina",
  "Nueces",
];

export const DISEASE_SUGGESTIONS: string[] = [
  "Ninguna",
  "Diabetes",
  "Hipertensión",
  "Asma",
  "Epilepsia",
  "Túnel carpiano",
  "Artritis",
  "Enfermedad renal crónica",
  "Hipotiroidismo",
  "Lupus",
  "Parkinson",
];

/**
 * Bleeding severity levels for triage
 */
export const BLEEDING_LEVELS: Record<string, string> = {
  NONE: "Ninguno",
  MILD: "Leve",
  MODERATE: "Moderado",
  SEVERE: "Severo",
};

/**
 * Overall patient status assessed by the paramedic
 */
export const PATIENT_STATUSES: Record<string, string> = {
  NONE: "Ninguno",
  STABLE: "Estable",
  CRITICAL: "Crítico",
  DECEASED: "Fallecido",
};

/**
 * The medical information of a citizen (e.g. base illnesses, relevant medical conditions, etc)
 */

export interface MedicalInfo {
  firstName: string;
  lastName: string;
  phone: string;
  documentType: string; // key of DOCUMENT_TYPES
  documentNumber: string;
  age: string;
  allergies: string[];
  diseases: string[];
  hasPacemaker: boolean | null;
  bloodType: string; // key of BLOOD_TYPES
  dataConsent: boolean | null;
}

/**
 * Simple location object
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * An alert to report an emergency to the system
 */
export interface Alert {
  reportedOn: Date;
  medicalInfo: MedicalInfo | null;
  location: GeoLocation | null;
}

/**
 * The status of an emergency
 */
export enum EmergencyStatus {
  RECEIVED,
  DISPATCHED,
  ON_SITE,
  ON_ROUTE,
  CLOSED,
  CANCELLED,
}

/**
 * An object containing all the relevant information for an emergency case
 */
export interface EmergencyCase extends Alert {
  // Unlike alerts, having this fields here is mandatory.
  medicalInfo: MedicalInfo;
  location: GeoLocation;
  emergencyState: EmergencyStatus;
}

/**
 * The report submitted by the paramedic after attending an emergency case
 */

export interface CaseReport {
  emergencyCase: EmergencyCase;
  bleedingLevel: string; // key of BLEEDING_LEVELS
  hasBruise: boolean;
  hasFracture: boolean;
  isUnconscious: boolean;
  treatment: string;
  patientStatus: string; // key of PATIENT_STATUSES
  submittedOn: Date;
}

export interface ParamedicUser {
  id: string; // key of the paramedic, e.g. employee ID
  email: string;
  name: string;
}

/**
 * An emergency assignment offered to a paramedic
 */
export interface EmergencyAssignment {
  id: string;
  emergencyCase: EmergencyCase;
  offeredAt: Date;
}

/**
 * A single point in a navigation route
 */
export interface RoutePoint {
  latitude: number;
  longitude: number;
}

/**
 * Route information between two locations
 */
export interface RouteInfo {
  points: RoutePoint[];
  estimatedMinutes: number;
  distanceKm: number;
  destinationLabel: string;
}

/**
 * The type of a PQRS subission
 */
export enum PQRSSubmissionType {
  ERROR,
  QUESTION,
  SUGGESTION,
}

/**
 * A submission to suggest about, complain or ortherwise comment on the application
 */
export interface PQRSSubmission {
  type: PQRSSubmissionType;
  phone: string;
  message: string;
}

// ─── Operator-specific types ────────────────────────────────────────────────

export interface OperatorUser {
  id: string;
  email: string;
  name: string;
  token: string; // JWT for WS connections
}

export interface TriageData {
  bleeding: boolean;
  dizziness: boolean;
  blurred_vision: boolean;
  unconscious: boolean;
  difficulty_breathing: boolean;
  fracture: boolean;
  chest_pain: boolean;
  numbness_limbs: boolean;
}

export interface OperatorAlert {
  reportedOn: string;
  medicalInfo: MedicalInfo | null;
  location: GeoLocation | null;
}

export interface OperatorParamedic {
  id: string;
  name: string;
  userRole: string;
}

/** SafeEmergency as received from the coordinator WebSocket */
export interface SafeEmergency {
  id: string;
  alert: OperatorAlert;
  assignedTo: OperatorParamedic | null;
  /** Backend EmergencyStatus value: RECEIVED | TRIAGED | ASSIGNED | ON_SITE | IN_TRANSFER | CLOSED | CANCELED */
  status: string;
  triage: TriageData | null;
  timeline: Record<string, string>;
}

export interface ParamedicLocation {
  id: string;
  name: string;
  location: GeoLocation;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export type ToastType = "PARAMEDIC_ACCEPTED" | "RETRIAGE";

export interface ToastData {
  type: ToastType;
  message: string;
}

export interface TriageFormData {
  dizziness: boolean | null;
  bleeding: boolean | null;
  blurred_vision: boolean | null;
  unconscious: boolean | null;
  difficulty_breathing: boolean | null;
  fracture: boolean | null;
  chest_pain: boolean | null;
  numbness_limbs: boolean | null;
}

export interface EditEmergencyFormData {
  fullName: string;
  estimatedAge: string;
  knownConditions: string;
  observations: string;
}
