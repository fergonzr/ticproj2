import { createContext, useContext } from "react";
import { useState, ReactNode, ReactElement } from "react";
import { EmergencyUpdateListener, CaseReportSubmitter } from "./interfaces";
import { MockEmergencyUpdateListener, MockCaseReportSubmitter } from "./mock";
import { MedicalInfo } from "../models";

/**
 * Content available through the backend API
 */
export type ApiContent = {
  emergencyUpdateListener: EmergencyUpdateListener;
  caseReportSubmitter: CaseReportSubmitter;
};

/**
 * Context that provides the API connections.
 * Currently all implementations alre mocked.
 */
export const ApiContext = createContext<ApiContent>({
  emergencyUpdateListener: new MockEmergencyUpdateListener(),
  caseReportSubmitter: new MockCaseReportSubmitter(),
});

/**
 * custom hook that provides and ApiContext context.
 * @returns ApiContext for interacting with the backend.
 */
export const useApi = () => useContext(ApiContext);
