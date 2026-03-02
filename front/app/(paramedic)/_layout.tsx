import { Stack } from "expo-router";
import { createContext, useContext, useState, ReactElement } from "react";
import { ParamedicUserProvider } from "@/lib/hooks/useParamedicUser";
import { EmergencyCase } from "@/lib/models";
// --- Active Emergency Context ---

type ActiveEmergencyContent = {
  activeEmergency: EmergencyCase | null;
  setActiveEmergency: (e: EmergencyCase | null) => void;
};

export const ActiveEmergencyContext = createContext<ActiveEmergencyContent>({
  activeEmergency: null,
  setActiveEmergency: () => {},
});

export const useActiveEmergency = () => useContext(ActiveEmergencyContext);

/**
 * Simple Stack (push-pop navigation) layout to group the paramedic screens.
 */
export default function ParamedicLayout(): ReactElement {
  const [activeEmergency, setActiveEmergency] = useState<EmergencyCase | null>(null);

  return (
    <ParamedicUserProvider>
      <ActiveEmergencyContext.Provider value={{ activeEmergency, setActiveEmergency }}>
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName="LoginScreen"
        />
      </ActiveEmergencyContext.Provider>
    </ParamedicUserProvider>
  );
}