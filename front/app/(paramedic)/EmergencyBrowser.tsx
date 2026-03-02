import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation, useRouter } from "expo-router";
import { useApi } from "@/lib/api/useApi";
import { useParamedicUser } from "@/lib/hooks/useParamedicUser";
import { useActiveEmergency } from "@/lib/hooks/useActiveEmergency";
import { EmergencyAssignment, RouteInfo, EmergencyCase } from "@/lib/models";
import { BLOOD_TYPES, DISEASES } from "@/lib/models";
import { LEAFLET_HTML } from "@/lib/map/leafletHtml";
import * as str from "@/lib/strings";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import { MockParamedicLocationTracker } from "@/lib/api/mock";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Button, useTheme } from "@rneui/themed";

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
  console.log(paramedicUser);
  const {
    paramedicLocationTracker: locationTracker,
    emergencyAssignmentListener,
    routeProvider,
  } = useApi();
  const { activeEmergency, setActiveEmergency } = useActiveEmergency();
  console.log(activeEmergency);
  const webViewRef = useRef<WebView>(null);
  const { theme } = useTheme();

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
    <SafeAreaView edges={["bottom"]}>
      <View className="h-full flex-col flex-nowrap justify-start bg-white">
        {/* Offline Leaflet Map via WebView */}
        <View className="w-full flex-grow">
          <WebView
            ref={webViewRef}
            source={{ html: LEAFLET_HTML }}
            originWhitelist={["*"]}
            javaScriptEnabled={true}
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
          />
        </View>

        {/* Route banner (top) */}
        {screenState === "route" && routeInfo && (
          <View className="absolute top-0 left-0 right-0 bg-primary py-1 pt-1">
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
    </SafeAreaView>
  );

  // --- Panel renderers ---

  function renderIdlePanel(): ReactElement {
    return (
      <View className="bg-white absolute bottom-0 left-0 right-0 bg-background px-lg pt-2 pb-[calc(3rem+1rem)] max-h-[35vh] shadow-lg shadow-black/10">
        <Text className="text-primary font-bold text-lg text-center mb-4">
          {str.emergencyListTitle}
        </Text>
        <Text className="text-placeholder text-center text-lg">
          {str.noActiveEmergency}
        </Text>
      </View>
    );
  }

  function renderPendingPanel(): ReactElement {
    const ec = pendingAssignment?.emergencyCase;
    return (
      <View className="bg-white px-4 py-2">
        <Text className="text-primary font-bold text-xl text-center mb-4">
          {str.emergencyListTitle}
        </Text>
        {ec && (
          <View className="border-1 border border-black rounded-2xl p-2">
            <View className="flex-row items-center rounded-md mb-2 p-4">
              <View className="w-10 h-10 bg-danger rounded-full mr-4" />
              <View className="flex-1">
                <Text className="font-bold text-lg text-text ">
                  Alerta #{pendingAssignment?.id.split("-").pop()}
                </Text>
                <Text className="text-13 text-textLight">
                  {ec.location.latitude.toFixed(4)},{" "}
                  {ec.location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between gap-4">
              <TouchableOpacity
                className="px-4 py-2 bg-primarypale flex-grow rounded-lg"
                onPress={handleAccept}
                disabled={isLoading}
              >
                <Text className="text-2xl text-primaryshade font-bold text-center">
                  {str.acceptRequest}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-dangerpale px-2 py-2 rounded-md py-sm px-lg items-center mx-sm"
                onPress={handleReject}
              >
                <AntDesign
                  name="close"
                  size={24}
                  color={theme.colors.error}
                  className="text-danger font-600 text-15"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  function renderActivePanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View className="bg-white px-lg pt-4 mb-2">
        <Text className="text-primary font-bold text-xl text-center mb-xs">
          Alerta #1
        </Text>
        <Text className="text-14 text-lg text-center">
          {str.labelName}: {info.firstName} {info.lastName}
        </Text>
        <Text className="text-14 text-text text-center text-lg">
          {str.labelLocation}: {emergency.location.latitude.toFixed(4)},{" "}
          {emergency.location.longitude.toFixed(4)}
        </Text>
        <View className="flex-row mt-4 mx-2">
          <TouchableOpacity
            className="border border-borderButton mx-2 rounded-full flex-grow py-1"
            onPress={handleRoute}
            disabled={isLoading}
          >
            <Text className="text-text font-600 text-lg text-center">
              {str.routeTo}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-border mx-2 rounded-full flex-grow py-1"
            onPress={handleCall}
          >
            <Text className="text-text font-600 text-lg text-center">
              {str.callPatient}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="border border-borderButton mx-2 rounded-full flex-grow py-1"
            onPress={handleInfo}
          >
            <Text className="text-text font-600 text-lg text-center">
              {str.patientInfo}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderRoutePanel(): ReactElement {
    return (
      <View className="bg-white flex-row items-center justify-between px-4 py-4 border-t border-border">
        <TouchableOpacity
          onPress={() => setScreenState("active")}
          className="bg-dangerpale px-2 py-2 rounded-md py-sm px-lg items-center mx-sm"
        >
          <AntDesign
            name="close"
            size={32}
            color={theme.colors.error}
            className="font-600 text-15"
          />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-2xl font-bold text-text">
            {routeInfo?.estimatedMinutes} {str.estimatedTime}
          </Text>
          <Text className="text-12 text-gray">{routeInfo?.distanceKm} km</Text>
        </View>
        <TouchableOpacity
          onPress={handleReportArrival}
          className="bg-primarypale px-2 py-2 rounded-md py-sm px-lg items-center mx-sm"
        >
          <AntDesign
            name="check"
            size={32}
            color={theme.colors.primary}
            className="font-600 text-15"
          />
        </TouchableOpacity>
      </View>
    );
  }

  function renderInfoPanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View className="bg-white px-lg pt-4 mb-2">
        <Text className="text-primary font-bold text-xl text-center">
          Alerta #1
        </Text>
        <ScrollView>
          <View className="flex flex-col items-center justify-center py-2 px-10">
            <View className="flex items-center flex-row">
              <Text className="font-bold w-32 text-lg">{str.labelName}:</Text>
              <Text className="text-text flex-1 text-lg">{info.firstName}</Text>
            </View>
            <View className="flex items-center flex-row">
              <Text className="font-bold w-32 text-lg">
                {str.labelLastName}:
              </Text>
              <Text className="text-text flex-1 text-lg">{info.lastName}</Text>
            </View>
            <View className="flex items-center flex-row">
              <Text className="font-bold w-32 text-lg">{str.labelAge}:</Text>
              <Text className="text-text flex-1 text-lg">{info.age} años</Text>
            </View>
            <View className="flex items-center flex-row">
              <Text className="font-bold w-32 text-lg">
                {str.labelAllergies}:
              </Text>
              <Text className="text-text flex-1 text-lg">
                {formatAllergies(info.allergies)}
              </Text>
            </View>
            <View className="flex items-center flex-row">
              <Text className="font-bold w-32 text-lg">
                {str.labelDiseases}:
              </Text>
              <Text className="text-text flex-1 text-lg">
                {DISEASES[info.disease] ?? info.disease}
              </Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="font-bold w-32 text-lg">
                {str.labelPacemaker}:
              </Text>
              <Text className="text-text flex-1 text-lg">
                {info.hasPacemaker ? "Sí" : "No"}
              </Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="font-bold w-32 text-lg">
                {str.labelBloodType}:
              </Text>
              <Text className="text-text flex-1 text-lg">
                {BLOOD_TYPES[info.bloodType] ?? info.bloodType}
              </Text>
            </View>
          </View>
        </ScrollView>
        <View className="flex-row justify-around mt-lg">
          <TouchableOpacity
            className="w-32 border border-borderButton rounded-full py-2"
            onPress={handleReportArrival}
          >
            <Text className="text-center font-600 text-14">{str.triage}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-32 border border-borderButton rounded-full py-2"
            onPress={() => setScreenState("active")}
          >
            <Text className="text-center font-600 text-14">{str.goBack}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
