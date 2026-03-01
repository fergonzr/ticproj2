/**
 * Thrown when paramedic login fails due to wrong email or password.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Thrown when a case report submission fails.
 */
export class ReportSubmissionError extends Error {
  constructor() {
    super("Report submission failed");
    this.name = "ReportSubmissionError";
  }
}

/**
 * Thrown when accepting an emergency assignment fails.
 */
export class AssignmentAcceptError extends Error {
  constructor() {
    super("Failed to accept assignment");
    this.name = "AssignmentAcceptError";
  }
}

/**
 * Thrown when rejecting an emergency assignment fails.
 */
export class AssignmentRejectError extends Error {
  constructor() {
    super("Failed to reject assignment");
    this.name = "AssignmentRejectError";
  }
}

/**
 * Thrown when fetching a route between two locations fails.
 */
export class RouteFetchError extends Error {
  constructor() {
    super("Failed to fetch route");
    this.name = "RouteFetchError";
  }
}

/**
 * Thrown when persisting medical info to SecureStore fails.
 */
export class MedicalInfoSaveError extends Error {
  constructor() {
    super("Failed to save medical info");
    this.name = "MedicalInfoSaveError";
  }
}

/**
 * Thrown when persisting or clearing the paramedic user in SecureStore fails.
 */
export class UserPersistError extends Error {
  constructor() {
    super("Failed to persist user");
    this.name = "UserPersistError";
  }
}
