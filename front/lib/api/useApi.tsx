import { createContext, useContext } from "react";
import {
  EmergencyUpdateListener, CaseReportSubmitter, ParamedicAuthenticator,
  EmergencyAssignmentListener, RouteProvider,
} from "./interfaces";
import {
  MockEmergencyUpdateListener, MockCaseReportSubmitter, MockParamedicAuthenticator,
  MockEmergencyAssignmentListener, MockRouteProvider,
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
});

/**
 * custom hook that provides and ApiContext context.
 * @returns ApiContext for interacting with the backend.
 */
export const useApi = () => useContext(ApiContext);
