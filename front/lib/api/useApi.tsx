import { createContext, useContext } from "react";
import { EmergencyUpdateListener, CaseReportSubmitter, ParamedicAuthenticator } from "./interfaces";
import { MockEmergencyUpdateListener, MockCaseReportSubmitter, MockParamedicAuthenticator } from "./mock";

/**
 * Content available through the backend API
 */
export type ApiContent = {
  emergencyUpdateListener: EmergencyUpdateListener;
  caseReportSubmitter: CaseReportSubmitter;
  paramedicAuthenticator: ParamedicAuthenticator;
};

/**
 * Context that provides the API connections.
 * Currently all implementations are mocked.
 */
export const ApiContext = createContext<ApiContent>({
  emergencyUpdateListener: new MockEmergencyUpdateListener(),
  caseReportSubmitter: new MockCaseReportSubmitter(),
  paramedicAuthenticator: new MockParamedicAuthenticator(),
});

/**
 * custom hook that provides and ApiContext context.
 * @returns ApiContext for interacting with the backend.
 */
export const useApi = () => useContext(ApiContext);
