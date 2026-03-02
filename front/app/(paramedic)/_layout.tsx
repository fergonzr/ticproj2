import { Stack } from "expo-router";
import { useState, ReactElement } from "react";
import { ActiveEmergencyContext } from "@/lib/hooks/useActiveEmergency";
import { ParamedicUserProvider } from "@/lib/hooks/useParamedicUser";
import { EmergencyCase } from "@/lib/models";
/**
 * Simple Stack (push-pop navigation) layout to group the paramedic screens.
 */
export default function ParamedicLayout(): ReactElement {
  const [activeEmergency, setActiveEmergency] = useState<EmergencyCase | null>(
    null,
  );

  return (
    <ParamedicUserProvider>
      <ActiveEmergencyContext.Provider
        value={{ activeEmergency, setActiveEmergency }}
      >
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName="LoginScreen"
        />
      </ActiveEmergencyContext.Provider>
    </ParamedicUserProvider>
  );
}
