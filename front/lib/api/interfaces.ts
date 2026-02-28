import { Alert, EmergencyCase, CaseReport, ParamedicUser } from "../models";

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

