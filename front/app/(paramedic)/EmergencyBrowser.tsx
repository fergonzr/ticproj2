import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRouter } from "expo-router";
import { useApi } from "@/lib/api/useApi";
import { useParamedicUser } from "@/lib/hooks/useParamedicUser";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { EmergencyAssignment, RouteInfo, EmergencyCase } from "@/lib/models";
import { BLOOD_TYPES, DISEASES } from "@/lib/models";
import { LEAFLET_HTML } from "@/lib/map/leafletHtml";
import * as str from "@/lib/strings";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import { MockParamedicLocationTracker } from "@/lib/api/mock";

type ScreenState = "idle" | "pending" | "active" | "route" | "info";

// --- Helpers ---

function formatAllergies(a: {
  rhinitis: boolean;
  asthma: boolean;
  dermatitis: boolean;
}): string {
  const names: string[] = [];
  if (a.asthma) names.push("Asma");
  if (a.dermatitis) names.push("Dermatitis");
  if (a.rhinitis) names.push("Rinitis");
  return names.length > 0 ? names.join(", ") : "Ninguna";
}

/**
 * Screen to receive emergencies and manage those currently assigned to the Paramedic user.
 * Displays an offline Leaflet map via WebView and a bottom panel that changes based on state.
 */
export default function EmergencyBrowser(): ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const { paramedicUser } = useParamedicUser();
  const {
    paramedicLocationTracker: locationTracker,
    emergencyAssignmentListener,
    routeProvider,
  } = useApi();
  const { activeEmergency, setActiveEmergency } = useActiveEmergency();
  const webViewRef = useRef<WebView>(null);

  const [screenState, setScreenState] = useState<ScreenState>("idle");
  const [pendingAssignment, setPendingAssignment] =
    useState<EmergencyAssignment | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize location tracking
  const locationTracking = useParamedicLocationTracking({
    locationTracker,
    updateIntervalMs: 10000,
    distanceInterval: 10,
  });

  // Update Drawer header title to "Paramédico"
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ title: str.paramedicLabel });
  }, [navigation]);

  // Send a message to the Leaflet WebView
  const postToMap = useCallback((msg: object) => {
    webViewRef.current?.postMessage(JSON.stringify(msg));
  }, []);

  // Polling for assignments when idle
  useEffect(() => {
    if (activeEmergency || !paramedicUser) return;

    emergencyAssignmentListener.startListening(
      paramedicUser.id,
      (assignment) => {
        setPendingAssignment(assignment);
        setScreenState("pending");

        // Show marker for the pending emergency on the map
        const loc = assignment.emergencyCase.location;
        postToMap({ type: "clearMarkers" });
        postToMap({
          type: "setMarker",
          lat: loc.latitude,
          lng: loc.longitude,
          center: true,
        });
      },
    );

    return () => {
      emergencyAssignmentListener.stopListening();
    };
  }, [activeEmergency, paramedicUser, emergencyAssignmentListener, postToMap]);

  // Sync screen state with activeEmergency from context
  useEffect(() => {
    if (activeEmergency && screenState === "idle") {
      setScreenState("active");
      // Show marker for active emergency
      const loc = activeEmergency.location;
      postToMap({ type: "clearMarkers" });
      postToMap({
        type: "setMarker",
        lat: loc.latitude,
        lng: loc.longitude,
        center: true,
      });
    }
    if (
      !activeEmergency &&
      screenState !== "idle" &&
      screenState !== "pending"
    ) {
      setScreenState("idle");
      setRouteInfo(null);
      postToMap({ type: "clearMarkers" });
    }
  }, [activeEmergency, screenState, postToMap]);

  const handleAccept = useCallback(async () => {
    if (!pendingAssignment) return;
    setIsLoading(true);
    try {
      const confirmed = await emergencyAssignmentListener.acceptAssignment(
        pendingAssignment.id,
      );
      setActiveEmergency(confirmed);
      setPendingAssignment(null);
      setScreenState("active");

      // Center map on accepted emergency
      const loc = confirmed.location;
      postToMap({ type: "clearMarkers" });
      postToMap({
        type: "setMarker",
        lat: loc.latitude,
        lng: loc.longitude,
        center: true,
      });
    } catch (err) {
      console.warn("Failed to accept assignment:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    pendingAssignment,
    emergencyAssignmentListener,
    setActiveEmergency,
    postToMap,
  ]);

  const handleReject = useCallback(async () => {
    if (!pendingAssignment) return;
    try {
      await emergencyAssignmentListener.rejectAssignment(pendingAssignment.id);
    } catch (err) {
      console.warn("Failed to reject assignment:", err);
    }
    setPendingAssignment(null);
    setScreenState("idle");
    postToMap({ type: "clearMarkers" });
  }, [pendingAssignment, emergencyAssignmentListener, postToMap]);

  const handleRoute = useCallback(async () => {
    if (!activeEmergency) return;
    setIsLoading(true);
    try {
      const route = await routeProvider.getRoute(
        { latitude: 6.168, longitude: -75.592 }, // mock paramedic position
        activeEmergency.location,
      );
      setRouteInfo(route);
      setScreenState("route");

      // Draw polyline on the map
      postToMap({
        type: "setPolyline",
        points: route.points,
      });
    } catch (err) {
      console.warn("Failed to get route:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeEmergency, routeProvider, postToMap]);

  const handleCall = useCallback(() => {
    if (!activeEmergency?.medicalInfo.phone) return;
    Linking.openURL(`tel:${activeEmergency.medicalInfo.phone}`);
  }, [activeEmergency]);

  const handleInfo = useCallback(() => {
    setScreenState("info");
  }, []);

  const handleReportArrival = useCallback(() => {
    if (!activeEmergency) return;
    const emergencyCase = activeEmergency;
    setActiveEmergency(null);
    setRouteInfo(null);
    setScreenState("idle");
    router.push({
      pathname: "/(paramedic)/Report",
      params: { emergencyCase: JSON.stringify(emergencyCase) },
    });
  }, [activeEmergency, setActiveEmergency, router]);

  return (
    <View className="flex-1 bg-background">
      {/* Offline Leaflet Map via WebView */}
      <WebView
        ref={webViewRef}
        className="flex-1"
        source={{ html: LEAFLET_HTML }}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />

      {/* Route banner (top) */}
      {screenState === "route" && routeInfo && (
        <View className="absolute top-0 left-0 right-0 bg-primary py-1 pt-xl">
          <View className="flex-row items-center justify-center w-full">
            <Text className="text-white text-2xl mr-md">↑</Text>
            <Text className="text-white text-md font-bold">
              {str.towards} {routeInfo.destinationLabel}
            </Text>
          </View>
        </View>
      )}

      {/* Panels based on state */}
      {screenState === "idle" && renderIdlePanel()}
      {screenState === "pending" && renderPendingPanel()}
      {screenState === "active" && renderActivePanel(activeEmergency!)}
      {screenState === "route" && renderRoutePanel()}
      {screenState === "info" &&
        activeEmergency &&
        renderInfoPanel(activeEmergency)}
    </View>
  );

  // --- Panel renderers ---

  function renderIdlePanel(): ReactElement {
    return (
      <View className="bg-white absolute bottom-0 left-0 right-0 bg-background rounded-t-lg rounded-t-lg px-lg pt-md pb-[calc(3rem+1rem)] max-h-[35vh] shadow-lg shadow-black/10">
        <Text className="text-primary font-bold text-18 text-center mb-md">
          {str.emergencyListTitle}
        </Text>
        <Text className="text-placeholder text-center text-14">
          {str.noActiveEmergency}
        </Text>
      </View>
    );
  }

  function renderPendingPanel(): ReactElement {
    const ec = pendingAssignment?.emergencyCase;
    return (
      <View className="bg-white absolute bottom-0 left-0 right-0 px-lg pt-md pb-[calc(3rem+1rem)] shadow-lg shadow-black/10">
        <Text className="text-primary font-bold text-18 text-center mb-md">
          {str.emergencyListTitle}
        </Text>
        {ec && (
          <>
            <View className="bg-white flex-row items-center border border-border rounded-md p-md mb-sm">
              <Text className="text-32 mr-md">👤</Text>
              <View className="flex-1">
                <Text className="font-bold text-15 text-text">
                  Alerta #{pendingAssignment?.id.split("-").pop()}
                </Text>
                <Text className="text-13 text-textLight">
                  {ec.location.latitude.toFixed(4)},{" "}
                  {ec.location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between border border-border rounded-md p-sm mt-xs">
              <TouchableOpacity
                className="flex-row items-center flex-1"
                onPress={handleAccept}
                disabled={isLoading}
              >
                <Text className="text-18 text-text mr-sm">»</Text>
                <Text className="text-14 text-text">{str.acceptRequest}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="p-sm" onPress={handleReject}>
                <Text className="text-18 text-text">✕</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  function renderActivePanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-lg rounded-t-lg px-lg pt-md pb-[calc(3rem+1rem)] shadow-lg shadow-black/10">
        <Text className="text-primary font-bold text-18 text-center mb-xs">
          Alerta #1
        </Text>
        <Text className="text-14 text-text text-center mb-xs">
          {str.labelName}: {info.firstName} {info.lastName}
        </Text>
        <Text className="text-14 text-text text-center mb-xs">
          {str.labelLocation}: {emergency.location.latitude.toFixed(4)},{" "}
          {emergency.location.longitude.toFixed(4)}
        </Text>
        <View className="flex-row justify-around mt-md">
          <TouchableOpacity
            className="border border-borderButton rounded-full py-sm px-lg"
            onPress={handleRoute}
            disabled={isLoading}
          >
            <Text className="text-text font-600 text-14">{str.routeTo}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-borderButton rounded-full py-sm px-lg"
            onPress={handleCall}
          >
            <Text className="text-text font-600 text-14">
              {str.callPatient}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-borderButton rounded-full py-sm px-lg"
            onPress={handleInfo}
          >
            <Text className="text-text font-600 text-14">
              {str.patientInfo}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderRoutePanel(): ReactElement {
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-white flex-row items-center justify-between px-lg pt-md pb-[calc(3rem+1rem)] border-t border-border">
        <TouchableOpacity
          className="p-sm"
          onPress={() => setScreenState("active")}
        >
          <Text className="text-18 text-text">✕</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-22 font-bold text-text">
            {routeInfo?.estimatedMinutes} {str.estimatedTime}
          </Text>
          <Text className="text-12 text-textLight">
            {routeInfo?.distanceKm} km
          </Text>
        </View>
        <TouchableOpacity
          className="border border-primary rounded-full py-sm px-lg"
          onPress={handleReportArrival}
        >
          <Text className="text-primary font-600 text-14">
            {str.reportArrival}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderInfoPanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-lg rounded-t-lg px-lg pt-md pb-[calc(3rem+1rem)] max-h-[55vh] shadow-lg shadow-black/10">
        <Text className="text-primary font-bold text-18 text-center mb-md">
          Alerta #1
        </Text>
        <ScrollView>
          <View className="flex-row mb-xs">
            <Text className="text-textLight w-32 text-14">
              {str.labelName}:
            </Text>
            <Text className="text-text flex-1 text-14">{info.firstName}</Text>
          </View>
          <View className="flex-row mb-xs">
            <Text className="text-textLight w-32 text-14">
              {str.labelLastName}:
            </Text>
            <Text className="text-text flex-1 text-14">{info.lastName}</Text>
          </View>
          <View className="flex-row mb-xs">
            <Text className="text-textLight w-32 text-14">{str.labelAge}:</Text>
            <Text className="text-text flex-1 text-14">{info.age} años</Text>
          </View>
          <View className="flex-row mb-xs">
            <Text className="text-textLight w-32 text-14">
              {str.labelAllergies}:
            </Text>
            <Text className="text-text flex-1 text-14">
              {formatAllergies(info.allergies)}
            </Text>
          </View>
          <View className="flex-row mb-xs">
            <Text className="text-textLight w-32 text-14">
              {str.labelDiseases}:
            </Text>
            <Text className="text-text flex-1 text-14">
              {DISEASES[info.disease] ?? info.disease}
            </Text>
          </View>
          <View className="flex-row mb-xs">
            <Text className="text-textLight w-32 text-14">
              {str.labelPacemaker}:
            </Text>
            <Text className="text-text flex-1 text-14">
              {info.hasPacemaker ? "Sí" : "No"}
            </Text>
          </View>
          <View className="flex-row mb-xs">
            <Text className="text-textLight w-32 text-14">
              {str.labelBloodType}:
            </Text>
            <Text className="text-text flex-1 text-14">
              {BLOOD_TYPES[info.bloodType] ?? info.bloodType}
            </Text>
          </View>
        </ScrollView>
        <View className="flex-row justify-around mt-lg">
          <TouchableOpacity
            className="border border-borderButton rounded-full py-sm px-lg"
            onPress={handleReportArrival}
          >
            <Text className="text-text font-600 text-14">{str.triage}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-borderButton rounded-full py-sm px-lg"
            onPress={() => setScreenState("active")}
          >
            <Text className="text-text font-600 text-14">{str.goBack}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
