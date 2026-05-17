import { Stack } from "expo-router";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactElement,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import { ParamedicUserProvider, useParamedicUser } from "@/lib/hooks/useParamedicUser";
import { EmergencyCase } from "@/lib/models";
import { ApiContext, useApi } from "@/lib/api/useApi";
import { RealParamedicTrackerAndListener, RealRouteProvider } from "@/lib/api/real";
import * as str from "@/lib/strings";

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

// --- Paramedic services provider ---
// Overrides the ApiContext with real tracker/listener instances that hold
// the logged-in paramedic's JWT token. Re-creates the instance whenever
// the token changes (i.e., after login or logout).

function ParamedicServicesProvider({ children }: { children: ReactNode }): ReactElement {
  const { paramedicUser } = useParamedicUser();
  const parentApi = useApi();

  const realTracker = useMemo(() => {
    if (!paramedicUser?.token) return null;
    return new RealParamedicTrackerAndListener(paramedicUser.token);
  }, [paramedicUser?.token]);

  // Surface backend ERROR events from the coordination WS as native alerts.
  useEffect(() => {
    if (!realTracker) return;
    realTracker.setOnCoordinationError((message) => {
      Alert.alert(str.alertError, message);
    });
    return () => realTracker.setOnCoordinationError(null);
  }, [realTracker]);

  // The /locationTracker WS does double duty: it both publishes the
  // paramedic's GPS and surfaces assignment offers. It must stay open for
  // the whole shift — not just while EmergencyBrowser is mounted — so the
  // operator can keep tracking the paramedic across all stages of the
  // response (en route, on site, en route to hospital). The lifecycle
  // lives here so navigation between paramedic screens doesn't cycle the
  // socket. Screens register their offer callbacks via setOnNewAssignment.
  useEffect(() => {
    if (!realTracker || !paramedicUser) return;
    realTracker.startListening(
      paramedicUser.id,
      () => {
        // No-op default. EmergencyBrowser overrides via setOnNewAssignment.
      },
      (reason) => {
        if (reason === "auth_error") {
          Alert.alert(str.alertError, str.alertSessionExpired);
        }
      },
    );
    return () => realTracker.stopListening();
  }, [realTracker, paramedicUser]);

  const apiValue = useMemo(() => {
    if (!realTracker) return parentApi;
    return {
      ...parentApi,
      paramedicLocationTracker: realTracker,
      emergencyAssignmentListener: realTracker,
      routeProvider: new RealRouteProvider(paramedicUser!.token),
    };
  }, [parentApi, realTracker, paramedicUser]);

  return <ApiContext.Provider value={apiValue}>{children}</ApiContext.Provider>;
}

/**
 * Simple Stack (push-pop navigation) layout to group the paramedic screens.
 */
export default function ParamedicLayout(): ReactElement {
  const [activeEmergency, setActiveEmergency] = useState<EmergencyCase | null>(null);

  return (
    <ParamedicUserProvider>
      <ParamedicServicesProvider>
        <ActiveEmergencyContext.Provider value={{ activeEmergency, setActiveEmergency }}>
          <Stack
            screenOptions={{ headerShown: false }}
            initialRouteName="LoginScreen"
          />
        </ActiveEmergencyContext.Provider>
      </ParamedicServicesProvider>
    </ParamedicUserProvider>
  );
}
