import { createContext, useContext } from "react";
import { EmergencyCase } from "@/lib/models";

type ActiveEmergencyContent = {
  activeEmergency: EmergencyCase | null;
  setActiveEmergency: (e: EmergencyCase | null) => void;
};

export const ActiveEmergencyContext = createContext<ActiveEmergencyContent>({
  activeEmergency: null,
  setActiveEmergency: () => {},
});

export const useActiveEmergency = () => useContext(ActiveEmergencyContext);
