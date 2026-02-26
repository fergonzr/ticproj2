import { createContext, useContext } from "react";
import { EmergencyUpdateListener } from "./interfaces";
import { MockEmergencyUpdateListener } from "./mock";

/**
 * Content available through the backend API
 */
export type ApiContent = {
  emergencyUpdateListener: EmergencyUpdateListener;
};

/**
 * Context that provides the API connections.
 * Currently all implementations alre mocked.
 */
export const ApiContext = createContext<ApiContent>({
  emergencyUpdateListener: new MockEmergencyUpdateListener(),
});

/**
 * custom hook that provides and ApiContext context.
 * @returns ApiContext for interacting with the backend.
 */
export const useApi = () => useContext(ApiContext);
