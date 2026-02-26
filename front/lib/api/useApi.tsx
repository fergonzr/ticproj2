import { createContext, useContext } from "react";
import { EmergencyUpdateListener } from "./interfaces";
import { MockEmergencyUpdateListener } from "./mock";

export type ApiContent = {
  emergencyUpdateListener: EmergencyUpdateListener;
};

export const ApiContext = createContext<ApiContent>({
  emergencyUpdateListener: new MockEmergencyUpdateListener(),
});

export const useApi = () => useContext(ApiContext);
