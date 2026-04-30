import {
  Alert,
  EmergencyCase,
  EmergencyStatus,
  CaseReport,
  ParamedicUser,
  OperatorUser,
  EmergencyAssignment,
  GeoLocation,
  RouteInfo,
  MedicalInfo,
  PQRSSubmission,
} from "../models";
import {
  EmergencyUpdateListener,
  CaseReportSubmitter,
  ParamedicAuthenticator,
  EmergencyAssignmentListener,
  RouteProvider,
  ParamedicLocationTracker,
  PQRSSubmissionSubmitter,
  OperatorAuthenticator,
  OperatorService,
  OperatorEvent,
  TriageData,
} from "./interfaces";
import { InvalidCredentialsError } from "./errors";
import * as str from "@/lib/strings";

/**
 * A mock implementation of the EmergencyUpdateListener interface.
 * Simulates status changes over time with realistic pacing.
 */
export class MockEmergencyUpdateListener implements EmergencyUpdateListener {
  /**
   * Reports an emergency and simulates status changes over time.
   * @param alert The alert containing details about the emergency.
   * @param onStatusChange Callback invoked on every status change.
   * @returns A promise that resolves with the initial EmergencyCase.
   */
  async reportEmergency(
    alert: Alert,
    onStatusChange: (emergencyCase: EmergencyCase) => void,
  ): Promise<EmergencyCase> {
    const emergencyCase: EmergencyCase = {
  ...alert,
  medicalInfo: alert.medicalInfo as MedicalInfo,
  location: alert.location as GeoLocation,
  emergencyState: EmergencyStatus.RECEIVED,
};

    const statuses: EmergencyStatus[] = [
      EmergencyStatus.DISPATCHED,
      EmergencyStatus.ON_ROUTE,
      EmergencyStatus.ON_SITE,
      EmergencyStatus.CLOSED,
    ];

    const delaySeconds = 3;
    console.log("🚨 Emergency alert received:");
    console.log(JSON.stringify(alert, null, 2));

    // [CHANGE 2] Log uses the human-readable label instead of the raw
    // numeric enum value — much easier to follow in the console during dev.
    const statusUpdatePromises = statuses.map(async (status) => {
      await new Promise((resolve) =>
        setTimeout(resolve, (status + delaySeconds) * 3000),
      );
      emergencyCase.emergencyState = status;
      console.log(`Status update → ${str.emergencyStatusMessages[status]}`);
      onStatusChange({ ...emergencyCase });
    });

    Promise.all(statusUpdatePromises);

    return emergencyCase;
  }
}

/**
 * Mock implementation of CaseReportSubmitter.
 */
export class MockCaseReportSubmitter implements CaseReportSubmitter {
  async submitReport(report: CaseReport): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log("Mock report submitted:", JSON.stringify(report, null, 2));
  }
}

export class MockParamedicAuthenticator implements ParamedicAuthenticator {
  async login(email: string, password: string): Promise<ParamedicUser> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (email === "paramedic@example.com" && password === "password123") {
      return {
        id: "mock-paramedic-id",
        email: email,
        name: "Mock Paramedic",
      };
    }
    throw new InvalidCredentialsError();
  }
}

// --- Mock data ---

const MOCK_MEDICAL_INFO: MedicalInfo = {
  firstName: "Salomé",
  lastName: "Pulgarín Rivera",
  phone: "3001234567",
  documentType: "NATIONAL_ID",
  documentNumber: "1017654321",
  age: "22",
  allergies: ["Rinitis", "Asma", "Dermatitis"],
  diseases: ["Túnel carpiano"],
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
 */
export class MockEmergencyAssignmentListener
  implements EmergencyAssignmentListener
{
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private assignmentCounter = 0;

  startListening(
    _paramedicId: string,
    onNewAssignment: (assignment: EmergencyAssignment) => void,
    _onError?: (reason: "auth_error" | "connection_error") => void,
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

  async reportArrival(): Promise<void> {
    // Mock no-op — arrival is handled automatically in the mock flow.
  }
}

/**
 * Mock implementation of RouteProvider.
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

/**
 * Mock implementation of ParamedicLocationTracker.
 */
export class MockParamedicLocationTracker implements ParamedicLocationTracker {
  async reportLocation(
    paramedicId: string,
    location: GeoLocation,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log(
      `Mock location update sent for paramedic ${paramedicId}: ` +
        `${location.latitude}, ${location.longitude}`,
    );
  }
}

/**
 * Mock implementation of PQRSSubmissionSubmitter.
 */
export class MockPQRSSubmissionSubmitter implements PQRSSubmissionSubmitter {
  async submitPQRS(submission: PQRSSubmission): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(
      "Mock PQRS submission submitted:",
      JSON.stringify(submission, null, 2),
    );
  }
}

/**
 * Mock implementation of OperatorAuthenticator.
 */
export class MockOperatorAuthenticator implements OperatorAuthenticator {
  async login(email: string, password: string): Promise<OperatorUser> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (email === "operator@example.com" && password === "password123") {
      return {
        id: "mock-operator-id",
        email,
        name: "Mock Operator",
        token: "mock-operator-token",
      };
    }
    throw new InvalidCredentialsError();
  }
}

/**
 * Mock implementation of OperatorService.
 * Does nothing — swap for RealOperatorService to connect to the backend.
 */
export class MockOperatorService implements OperatorService {
  connect(_token: string, _onEvent: (event: OperatorEvent) => void): void {}
  disconnect(): void {}
  triageEmergency(_emergencyId: string, _triage: TriageData): void {}
  assignParamedic(_emergencyId: string, _paramedicId: string): void {}
}
