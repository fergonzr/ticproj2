import { Alert, EmergencyCase, EmergencyStatus, CaseReport } from "../models";
import { EmergencyUpdateListener, CaseReportSubmitter } from "./interfaces";

/**
 * A mock implementation of the EmergencyUpdateListener interface.
 * This mock simulates the process of updating the status of an emergency over a set number of seconds.
 */
export class MockEmergencyUpdateListener implements EmergencyUpdateListener {
  /**
   * Reports an emergency and simulates status changes over time.
   * @param alert The alert containing details about the emergency.
   * @param onStatusChange A callback function that is invoked whenever the emergency status changes.
   * @returns A promise that resolves with the final EmergencyCase.
   */
  async reportEmergency(
    alert: Alert,
    onStatusChange: (emergencyCase: EmergencyCase) => void,
  ): Promise<EmergencyCase> {
    // Create the initial emergency case with the RECEIVED status
    const emergencyCase: EmergencyCase = {
      ...alert,
      emergencyState: EmergencyStatus.RECEIVED,
    };

    // Simulate status changes over time
    const statuses: EmergencyStatus[] = [
      EmergencyStatus.DISPATCHED,
      EmergencyStatus.ON_ROUTE,
      EmergencyStatus.ON_SITE,
      EmergencyStatus.CLOSED,
    ];

    // Number of seconds to wait between status updates
    const delaySeconds = 1;

    // Execute status updates concurrently
    const statusUpdatePromises = statuses.map(async (status) => {
      await new Promise((resolve) =>
        setTimeout(resolve, (status + delaySeconds) * 3000),
      );
      console.log(`Emergency status changed, ${status}`);
      emergencyCase.emergencyState = status;
      onStatusChange({ ...emergencyCase });
    });

    // Wait for all status updates to complete
    Promise.all(statusUpdatePromises);

    return emergencyCase;
  }
}
/**
 * A mock implementation of CaseReportSubmitter.
 * Simulates a successful report submission with a short delay.
 */
export class MockCaseReportSubmitter implements CaseReportSubmitter {
  /**
   * Simulates submitting a case report.
   * @param report The CaseReport to submit.
   */
  async submitReport(report: CaseReport): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log("Mock report submitted:", JSON.stringify(report, null, 2));
  }
}