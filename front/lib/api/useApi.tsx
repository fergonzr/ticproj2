import { createContext, useContext } from "react";
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
} from "./interfaces";
import {
  MockEmergencyUpdateListener,
  MockCaseReportSubmitter,
  MockParamedicAuthenticator,
  MockEmergencyAssignmentListener,
  MockRouteProvider,
  MockParamedicLocationTracker,
  MockPQRSSubmissionSubmitter,
  MockOperatorAuthenticator,
  MockOperatorService,
} from "./mock";

/**
 * Content available through the backend API
 */
export type ApiContent = {
  emergencyUpdateListener: EmergencyUpdateListener;
  caseReportSubmitter: CaseReportSubmitter;
  paramedicAuthenticator: ParamedicAuthenticator;
  emergencyAssignmentListener: EmergencyAssignmentListener;
  routeProvider: RouteProvider;
  paramedicLocationTracker: ParamedicLocationTracker;
  pqrsSubmissionSubmitter: PQRSSubmissionSubmitter;
  operatorAuthenticator: OperatorAuthenticator;
  operatorService: OperatorService;
};

/**
 * Context that provides the API connections.
 */
export const ApiContext = createContext<ApiContent>({
  emergencyUpdateListener: new MockEmergencyUpdateListener(),
  caseReportSubmitter: new MockCaseReportSubmitter(),
  paramedicAuthenticator: new MockParamedicAuthenticator(),
  emergencyAssignmentListener: new MockEmergencyAssignmentListener(),
  routeProvider: new MockRouteProvider(),
  paramedicLocationTracker: new MockParamedicLocationTracker(),
  pqrsSubmissionSubmitter: new MockPQRSSubmissionSubmitter(),
  operatorAuthenticator: new MockOperatorAuthenticator(),
  operatorService: new MockOperatorService(),
});

/**
 * custom hook that provides an ApiContext context.
 * @returns ApiContext for interacting with the backend.
 */
export const useApi = () => useContext(ApiContext);
