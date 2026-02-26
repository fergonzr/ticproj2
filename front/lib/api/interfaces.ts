import { Alert, EmergencyCase } from "../models";

export interface EmergencyUpdateListener {
  reportEmergency(
    alert: Alert,
    onStatusChange: (emergencyCase: EmergencyCase) => void,
  ): Promise<EmergencyCase>;
}
