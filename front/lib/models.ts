/**
 * The medical information of a citizen (e.g. base illnesses, relevant medical conditions, etc)
 */
export interface MedicalInfo {
  nombre: string;
  apellidos: string;
  celular: string;
  tipoDocumento: "Cedula" | "Pasaporte" | "Tarjeta de identidad";
  documento: string;
  edad: string;
  alergias: {
    rinitis: boolean;
    asma: boolean;
    dermatitis: boolean;
  };
  enfermedades: string;
  marcaPasos: boolean | null;
  tipoSangre: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
  autorizaDatos: boolean | null;
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
 * The status of
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
 * Bleeding severity levels for triage
 */
export type BleedingLevel = "Ninguno" | "Leve" | "Moderado" | "Severo";

/**
 * Overall patient status assessed by the paramedic
 */
export type PatientStatus = "Ninguno" | "Estable" | "Critico" | "Fallecido";

/**
 * The report submitted by the paramedic after attending an emergency case
 */
export interface CaseReport {
  emergencyCase: EmergencyCase;
  sangrado: BleedingLevel;
  contusion: boolean;
  fractura: boolean;
  inconsciente: boolean;
  tratamiento: string;
  estadoPaciente: PatientStatus;
  submittedOn: Date;
}