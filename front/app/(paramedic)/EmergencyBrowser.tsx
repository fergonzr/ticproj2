import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation, useRouter } from "expo-router";
import { useApi } from "@/lib/api/useApi";
import { useParamedicUser } from "@/lib/hooks/useParamedicUser";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { EmergencyAssignment, RouteInfo, EmergencyCase } from "@/lib/models";
import { BLOOD_TYPES } from "@/lib/models";
import { LEAFLET_HTML } from "@/lib/map/leafletHtml";
import * as str from "@/lib/strings";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import { MockParamedicLocationTracker } from "@/lib/api/mock";
import AntDesign from "@expo/vector-icons/AntDesign";
import AppButton from "@/lib/components/AppButton";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";
import {
  AssignmentAcceptError,
  AssignmentRejectError,
  RouteFetchError,
} from "@/lib/api/errors";

type ScreenState = "idle" | "pending" | "active" | "route" | "info";

// --- Helpers ---

function formatAllergies(a?: string[]): string {
  return a && a.length > 0 ? a.join(", ") : str.optionNoneF;
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
    } catch (error) {
      const message =
        error instanceof AssignmentAcceptError
          ? str.alertAssignmentAcceptError
          : str.alertError;
      Alert.alert(str.alertError, message);
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
    } catch (error) {
      const message =
        error instanceof AssignmentRejectError
          ? str.alertAssignmentRejectError
          : str.alertError;
      Alert.alert(str.alertError, message);
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
    } catch (error) {
      const message =
        error instanceof RouteFetchError
          ? str.alertRouteFetchError
          : str.alertError;
      Alert.alert(str.alertError, message);
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

  const handleReportArrival = useCallback(async () => {
    if (!activeEmergency) return;
    try {
      await emergencyAssignmentListener.reportArrival();
    } catch (e) {
      console.warn("Failed to report arrival to backend", e);
    }
    const emergencyCase = activeEmergency;
    setActiveEmergency(null);
    setRouteInfo(null);
    setScreenState("idle");
    router.push({
      pathname: "/(paramedic)/Report",
      params: { emergencyCase: JSON.stringify(emergencyCase) },
    });
  }, [activeEmergency, setActiveEmergency, router, emergencyAssignmentListener]);

  return (
    <SafeAreaView edges={["bottom"]}>
      <Modal
        backdropColor={"#000000a0"}
        animationType="fade"
        visible={locationTracking.error !== null}
      >
        <View className="bg-white w-3/4 m-auto px-4 py-2 rounded-md flex flex-col gap-4 items-center">
          <Text className="font-bold text-3xl">{str.alertError}</Text>
          <Text className="text-xl">{str.alertLocationTrackerError}</Text>
          <AppButton
            title={str.proptToSettings}
            onPress={() => Linking.openSettings()}
          />
        </View>
      </Modal>
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
                  {str.alertLabel} #{pendingAssignment?.id.split("-").pop()}
                </Text>
                <Text className="text-13 text-textLight">
                  {ec.location.latitude.toFixed(4)},{" "}
                  {ec.location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between gap-4">
              <AppButton
                title={str.acceptRequest}
                onPress={handleAccept}
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                style={{ backgroundColor: colors.error, padding: spacing.sm, borderRadius: spacing.sm, alignItems: "center" }}
                onPress={handleReject}
              >
                <AntDesign name="close" size={24} color={colors.white} />
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
          {str.alertLabel} #1
        </Text>
        <Text className="text-14 text-lg text-center">
          {str.labelName}: {info.firstName} {info.lastName}
        </Text>
        <Text className="text-14 text-text text-center text-lg">
          {str.labelLocation}: {emergency.location.latitude.toFixed(4)},{" "}
          {emergency.location.longitude.toFixed(4)}
        </Text>
        <View className="flex-row mt-4 mx-2 gap-2">
          <AppButton
            variant="outline"
            title={str.routeTo}
            onPress={handleRoute}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          <AppButton
            variant="outline"
            title={str.callPatient}
            onPress={handleCall}
            style={{ flex: 1 }}
          />
          <AppButton
            variant="outline"
            title={str.patientInfo}
            onPress={handleInfo}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }

  function renderRoutePanel(): ReactElement {
    return (
      <View className="bg-white flex-row items-center justify-between px-4 py-4 border-t border-border">
        <TouchableOpacity
          onPress={() => setScreenState("active")}
          style={{ backgroundColor: colors.error, padding: spacing.sm, borderRadius: spacing.sm, alignItems: "center" }}
        >
          <AntDesign name="close" size={32} color={colors.white} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-2xl font-bold text-black">
            {routeInfo?.estimatedMinutes} {str.estimatedTime}
          </Text>
          <Text className="text-gray">{routeInfo?.distanceKm} km</Text>
        </View>
        <TouchableOpacity
          onPress={handleReportArrival}
          style={{ backgroundColor: colors.primary, padding: spacing.sm, borderRadius: spacing.sm, alignItems: "center" }}
        >
          <AntDesign name="check" size={32} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  function renderInfoPanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View className="bg-white px-lg pt-4 mb-2">
        <Text className="text-primary font-bold text-xl text-center">
          {str.alertLabel} #1
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
              <Text className="text-text flex-1 text-lg">{info.age} {str.unitYears}</Text>
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
                {info.diseases && info.diseases.length > 0 ? info.diseases.join(", ") : str.optionNoneF}
              </Text>
            </View>
            <View className="flex flex-row items-center">
              <Text className="font-bold w-32 text-lg">
                {str.labelPacemaker}:
              </Text>
              <Text className="text-text flex-1 text-lg">
                {info.hasPacemaker ? str.optionYes : str.optionNo}
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
        <View className="flex-row justify-around mt-4 gap-2">
          <AppButton
            variant="outline"
            title={str.triage}
            onPress={handleReportArrival}
            style={{ flex: 1 }}
          />
          <AppButton
            variant="outline"
            title={str.goBack}
            onPress={() => setScreenState("active")}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }
}
