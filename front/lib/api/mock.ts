import {
  Alert,
  EmergencyCase,
  EmergencyStatus,
  CaseReport,
  ParamedicUser,
  EmergencyAssignment,
  GeoLocation,
  RouteInfo,
  MedicalInfo,
} from "../models";
import {
  EmergencyUpdateListener,
  CaseReportSubmitter,
  ParamedicAuthenticator,
  EmergencyAssignmentListener,
  RouteProvider,
} from "./interfaces";

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
    console.log("Received alert:");
    console.log(alert);

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

export class MockParamedicAuthenticator implements ParamedicAuthenticator {
  /**
   * Simulates a paramedic login process.
   * @param email The paramedic's email address.
   * @param password The paramedic's password.
   * @returns A promise that resolves with a mock ParamedicUser if the credentials are valid, or rejects if they are not.
   */
  async login(email: string, password: string): Promise<ParamedicUser> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    if (email === "paramedic@example.com" && password === "password123") {
      return {
        id: "mock-paramedic-id",
        email: email,
        name: "Mock Paramedic",
      };
    }
    throw new Error("Invalid credentials");
  }
}

// --- Mock data for emergency assignments ---

const MOCK_MEDICAL_INFO: MedicalInfo = {
  firstName: "Salomé",
  lastName: "Pulgarín Rivera",
  phone: "3001234567",
  documentType: "NATIONAL_ID",
  documentNumber: "1017654321",
  age: "22",
  allergies: { rhinitis: true, asthma: true, dermatitis: true },
  disease: "CARPAL_TUNNEL",
  hasPacemaker: true,
  bloodType: "O_POSITIVE",
  dataConsent: true,
};

const MOCK_EMERGENCY_CASE: EmergencyCase = {
  reportedOn: new Date(),
  medicalInfo: MOCK_MEDICAL_INFO,
  location: { latitude: 6.1714, longitude: -75.5901 },
  emergencyState: EmergencyStatus.RECEIVED,
};

/**
 * Mock implementation of EmergencyAssignmentListener.
 * Offers a hardcoded assignment every N seconds when listening.
 */
export class MockEmergencyAssignmentListener implements EmergencyAssignmentListener {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private assignmentCounter = 0;

  startListening(
    _paramedicId: string,
    onNewAssignment: (assignment: EmergencyAssignment) => void,
  ): void {
    this.stopListening();
    this.intervalId = setInterval(() => {
      this.assignmentCounter += 1;
      onNewAssignment({
        id: `mock-assignment-${this.assignmentCounter}`,
        emergencyCase: {
          ...MOCK_EMERGENCY_CASE,
          reportedOn: new Date(),
        },
        offeredAt: new Date(),
      });
    }, 10_000);
  }

  stopListening(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async acceptAssignment(_assignmentId: string): Promise<EmergencyCase> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      ...MOCK_EMERGENCY_CASE,
      emergencyState: EmergencyStatus.DISPATCHED,
    };
  }

  async rejectAssignment(_assignmentId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

/**
 * Mock implementation of RouteProvider.
 * Returns a hardcoded route around Envigado.
 */
export class MockRouteProvider implements RouteProvider {
  async getRoute(_from: GeoLocation, _to: GeoLocation): Promise<RouteInfo> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      points: [
        { latitude: 6.168, longitude: -75.592 },
        { latitude: 6.169, longitude: -75.5915 },
        { latitude: 6.17, longitude: -75.5908 },
        { latitude: 6.1708, longitude: -75.5905 },
        { latitude: 6.1714, longitude: -75.5901 },
      ],
      estimatedMinutes: 15,
      distanceKm: 2.0,
      destinationLabel: "Calle 38 #99-1",
    };
  }
}
