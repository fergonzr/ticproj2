
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

export const DISEASES: Record<string, string> = {
  NONE: "Ninguna",
  CARPAL_TUNNEL: "Tunel carpeano",
  DIABETES: "Diabetes",
  HYPERTENSION: "Hipertension",
  EPILEPSY: "Epilepsia",
  ASTHMA: "Asma",
};

export interface Allergies {
  rhinitis: boolean;
  asthma: boolean;
  dermatitis: boolean;
}

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
  documentType: string;   // key of DOCUMENT_TYPES
  documentNumber: string;
  age: string;
  allergies: Allergies;
  disease: string;        // key of DISEASES
  hasPacemaker: boolean | null;
  bloodType: string;      // key of BLOOD_TYPES
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
  medicalInfo: MedicalInfo;
  location: GeoLocation;
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
  emergencyState: EmergencyStatus;
}



/**
 * The report submitted by the paramedic after attending an emergency case
 */

export interface CaseReport {
  emergencyCase: EmergencyCase;
  bleedingLevel: string;  // key of BLEEDING_LEVELS
  hasBruise: boolean;
  hasFracture: boolean;
  isUnconscious: boolean;
  treatment: string;
  patientStatus: string;  // key of PATIENT_STATUSES
  submittedOn: Date;
}

export interface ParamedicUser{
  id: string; // key of the paramedic, e.g. employee ID
  email: string;
  name: string;
}