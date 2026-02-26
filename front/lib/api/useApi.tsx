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

// MedicalInfo Context

type MedicalInfoContent = {
  medicalInfo: MedicalInfo | null;
  setMedicalInfo: (info: MedicalInfo) => void;
};

/**
 * Context that holds the citizen's saved medical information.
 */
export const MedicalInfoContext = createContext<MedicalInfoContent>({
  medicalInfo: null,
  setMedicalInfo: () => {},
});

/**
 * Provider component for MedicalInfoContext.
 * Wrap the app root with this to make medical info available everywhere.
 */
export function MedicalInfoProvider({ children }: { children: ReactNode }): ReactElement {
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo | null>(null);

  return (
    <MedicalInfoContext.Provider value={{ medicalInfo, setMedicalInfo }}>
      {children}
    </MedicalInfoContext.Provider>
  );
}

/**
 * Custom hook to read and update the citizen's MedicalInfo.
 * @returns The current MedicalInfo and a setter.
 */
export const useMedicalInfo = () => useContext(MedicalInfoContext);
