/**
 * The medical information of a citizen (e.g. base illnesses, relevant medical conditions, etc)
 */
export interface MedicalInfo {
  // Todo: add actual content of this interface to be used in app/MedicalRegister
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
