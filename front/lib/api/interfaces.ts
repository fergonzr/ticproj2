import {
  Alert,
  EmergencyCase,
  EmergencyAssignment,
  CaseReport,
  ParamedicUser,
  GeoLocation,
  RouteInfo,
} from "../models";

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

/**
 * Listens for emergency assignments offered to a paramedic
 */
export interface EmergencyAssignmentListener {
  /**
   * Starts polling/subscribing for new assignments.
   * @param paramedicId The ID of the paramedic to listen for.
   * @param onNewAssignment Callback invoked when a new assignment is offered.
   */
  startListening(
    paramedicId: string,
    onNewAssignment: (assignment: EmergencyAssignment) => void,
  ): void;

  /** Stops polling/subscribing for assignments. */
  stopListening(): void;

  /**
   * Accepts an offered assignment.
   * @param assignmentId The ID of the assignment to accept.
   * @returns The confirmed EmergencyCase.
   */
  acceptAssignment(assignmentId: string): Promise<EmergencyCase>;

  /**
   * Rejects an offered assignment.
   * @param assignmentId The ID of the assignment to reject.
   */
  rejectAssignment(assignmentId: string): Promise<void>;
}

/**
 * Provides route information between two locations
 */
export interface RouteProvider {
  /**
   * Gets a route between two geographic points.
   * @param from Origin location.
   * @param to Destination location.
   * @returns Route information including polyline, ETA, and distance.
   */
  getRoute(from: GeoLocation, to: GeoLocation): Promise<RouteInfo>;
}

/**
 * Interface for tracking paramedic location and sending updates to the server
 */
export interface ParamedicLocationTracker {
  /**
   * Reports paramedic location to the server
   * @param paramedicId The ID of the paramedic
   * @param location The current location of the paramedic
   * @returns Promise that resolves when the location update is successfully sent
   */
  reportLocation(paramedicId: string, location: GeoLocation): Promise<void>;
}
