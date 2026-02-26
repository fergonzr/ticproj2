import { Alert, EmergencyCase } from "../models";

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
