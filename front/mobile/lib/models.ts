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
 * The set of symptoms an operator checks during the initial triage.
 * The criticality level is derived from these (see lib/utils/triagePriority).
 */
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
  IN_TRANSFER,
  CLOSED,
  CANCELLED,
}

/**
 * The medical center an emergency has been transferred to.
 * Populated when the emergency status is ON_ROUTE (en route to hospital).
 */
export interface TransferDestination {
  id: string;
  name: string;
  location: GeoLocation;
  phone?: string;
}

/**
 * An object containing all the relevant information for an emergency case
 */
export interface EmergencyCase extends Alert {
  // Unlike alerts, having this fields here is mandatory.
  id?: string; // backend emergency_id, set once the backend assigns it
  /** Stable user-facing case number derived by the backend from the report
   *  time (`hashlib.blake2b`, 5 bytes). The UUID `id` is for service-to-service
   *  routing; this is what we show to operators, paramedics, and citizens. */
  filingNumber?: number;
  medicalInfo: MedicalInfo;
  location: GeoLocation;
  emergencyState: EmergencyStatus;
  /** Initial triage symptoms set by the operator. Drives the criticality level. */
  triage?: TriageData | null;
  /** Complexity level assigned by the paramedic on site (the "retriage"). */
  complexityLevel?: ComplexityLevel | null;
  /** Medical center the emergency was transferred to. Set when the
   *  emergency status transitions to ON_ROUTE (paramedic en route to
   *  hospital). Null when the emergency has not been transferred. */
  transferedTo?: TransferDestination | null;
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
  token: string;
}

export interface OperatorUser {
  id: string;
  email: string;
  name: string;
  token: string;
  userRole?: string; // "OPERATOR" | "ANALYST" — optional for backward compat with stored sessions
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

// --- Prehospital care flow ---

export enum ComplexityLevel {
  BASIC = 0,
  INTERMEDIATE = 1,
  HIGH = 2,
}

export enum PatientFinalState {
  CRITICAL = 0,
  DETERIORATING = 1,
  STABLE = 2,
  IMPROVING = 3,
}

export interface MedicalCenter {
  id: string;
  name: string;
  phone: string;
  maxComplexityLevel: ComplexityLevel;
  specialties: string[];
  availableSlots: number | null;
  location: GeoLocation;
}

export interface PrehospitalCareReportData {
  initialStateDescription: string;
  treatmentDescription: string;
  finalState: PatientFinalState;
  finalStateDescription: string;
}
