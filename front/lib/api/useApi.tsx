import { createContext, useContext } from "react";
import {
  EmergencyUpdateListener,
  CaseReportSubmitter,
  ParamedicAuthenticator,
  EmergencyAssignmentListener,
  RouteProvider,
  ParamedicLocationTracker,
} from "./interfaces";
import {
  MockEmergencyUpdateListener,
  MockCaseReportSubmitter,
  MockParamedicAuthenticator,
  MockEmergencyAssignmentListener,
  MockRouteProvider,
  MockParamedicLocationTracker,
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
};

/**
 * Context that provides the API connections.
 * Currently all implementations are mocked.
 */
export const ApiContext = createContext<ApiContent>({
  emergencyUpdateListener: new MockEmergencyUpdateListener(),
  caseReportSubmitter: new MockCaseReportSubmitter(),
  paramedicAuthenticator: new MockParamedicAuthenticator(),
  emergencyAssignmentListener: new MockEmergencyAssignmentListener(),
  routeProvider: new MockRouteProvider(),
  paramedicLocationTracker: new MockParamedicLocationTracker(),
});

/**
 * custom hook that provides and ApiContext context.
 * @returns ApiContext for interacting with the backend.
 */
export const useApi = () => useContext(ApiContext);
