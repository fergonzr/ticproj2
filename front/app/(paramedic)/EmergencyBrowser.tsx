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
import styles from "@/lib/styles/EmergencyBrowser.styles";
import * as str from "@/lib/strings";

type ScreenState = "idle" | "pending" | "active" | "route" | "info";

// --- Helpers ---

function formatAllergies(a: { rhinitis: boolean; asthma: boolean; dermatitis: boolean }): string {
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
  const { emergencyAssignmentListener, routeProvider } = useApi();
  const { activeEmergency, setActiveEmergency } = useActiveEmergency();
  const webViewRef = useRef<WebView>(null);

  const [screenState, setScreenState] = useState<ScreenState>("idle");
  const [pendingAssignment, setPendingAssignment] = useState<EmergencyAssignment | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        postToMap({ type: "setMarker", lat: loc.latitude, lng: loc.longitude, center: true });
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
      postToMap({ type: "setMarker", lat: loc.latitude, lng: loc.longitude, center: true });
    }
    if (!activeEmergency && screenState !== "idle" && screenState !== "pending") {
      setScreenState("idle");
      setRouteInfo(null);
      postToMap({ type: "clearMarkers" });
    }
  }, [activeEmergency, screenState, postToMap]);

  const handleAccept = useCallback(async () => {
    if (!pendingAssignment) return;
    setIsLoading(true);
    try {
      const confirmed = await emergencyAssignmentListener.acceptAssignment(pendingAssignment.id);
      setActiveEmergency(confirmed);
      setPendingAssignment(null);
      setScreenState("active");

      // Center map on accepted emergency
      const loc = confirmed.location;
      postToMap({ type: "clearMarkers" });
      postToMap({ type: "setMarker", lat: loc.latitude, lng: loc.longitude, center: true });
    } catch (err) {
      console.warn("Failed to accept assignment:", err);
    } finally {
      setIsLoading(false);
    }
  }, [pendingAssignment, emergencyAssignmentListener, setActiveEmergency, postToMap]);

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
        { latitude: 6.1680, longitude: -75.5920 }, // mock paramedic position
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
    <View style={styles.container}>
      {/* Offline Leaflet Map via WebView */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: LEAFLET_HTML }}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />

      {/* Route banner (top) */}
      {screenState === "route" && routeInfo && (
        <View style={styles.routeBanner}>
          <View style={styles.routeDirection}>
            <Text style={styles.routeArrow}>↑</Text>
            <Text style={styles.routeDestText}>
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
      {screenState === "info" && activeEmergency && renderInfoPanel(activeEmergency)}
    </View>
  );

  // --- Panel renderers ---

  function renderIdlePanel(): ReactElement {
    return (
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>{str.emergencyListTitle}</Text>
        <Text style={styles.emptyText}>{str.noActiveEmergency}</Text>
      </View>
    );
  }

  function renderPendingPanel(): ReactElement {
    const ec = pendingAssignment?.emergencyCase;
    return (
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>{str.emergencyListTitle}</Text>
        {ec && (
          <>
            <View style={styles.alertCard}>
              <Text style={styles.alertIcon}>👤</Text>
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>
                  Alerta #{pendingAssignment?.id.split("-").pop()}
                </Text>
                <Text style={styles.alertAddress}>
                  {ec.location.latitude.toFixed(4)}, {ec.location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
            <View style={styles.acceptRow}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAccept}
                disabled={isLoading}
              >
                <Text style={styles.acceptChevron}>»</Text>
                <Text style={styles.acceptText}>{str.acceptRequest}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                <Text style={styles.rejectText}>✕</Text>
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
      <View style={styles.activePanel}>
        <Text style={styles.activeTitle}>Alerta #1</Text>
        <Text style={styles.activeInfo}>
          {str.labelName}: {info.firstName} {info.lastName}
        </Text>
        <Text style={styles.activeInfo}>
          {str.labelLocation}: {emergency.location.latitude.toFixed(4)}, {emergency.location.longitude.toFixed(4)}
        </Text>
        <View style={styles.activeButtonRow}>
          <TouchableOpacity style={styles.activeButton} onPress={handleRoute} disabled={isLoading}>
            <Text style={styles.activeButtonText}>{str.routeTo}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activeButton} onPress={handleCall}>
            <Text style={styles.activeButtonText}>{str.callPatient}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activeButton} onPress={handleInfo}>
            <Text style={styles.activeButtonText}>{str.patientInfo}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderRoutePanel(): ReactElement {
    return (
      <View style={styles.routeBottomPanel}>
        <TouchableOpacity style={styles.routeCloseButton} onPress={() => setScreenState("active")}>
          <Text style={styles.routeCloseText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.routeEta}>
          <Text style={styles.routeEtaTime}>
            {routeInfo?.estimatedMinutes} {str.estimatedTime}
          </Text>
          <Text style={styles.routeEtaDetails}>
            {routeInfo?.distanceKm} km
          </Text>
        </View>
        <TouchableOpacity style={styles.arrivalButton} onPress={handleReportArrival}>
          <Text style={styles.arrivalButtonText}>{str.reportArrival}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderInfoPanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View style={styles.infoOverlay}>
        <Text style={styles.infoTitle}>Alerta #1</Text>
        <ScrollView>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{str.labelName}:</Text>
            <Text style={styles.infoValue}>{info.firstName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{str.labelLastName}:</Text>
            <Text style={styles.infoValue}>{info.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{str.labelAge}:</Text>
            <Text style={styles.infoValue}>{info.age} años</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{str.labelAllergies}:</Text>
            <Text style={styles.infoValue}>{formatAllergies(info.allergies)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{str.labelDiseases}:</Text>
            <Text style={styles.infoValue}>{DISEASES[info.disease] ?? info.disease}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{str.labelPacemaker}:</Text>
            <Text style={styles.infoValue}>{info.hasPacemaker ? "Sí" : "No"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{str.labelBloodType}:</Text>
            <Text style={styles.infoValue}>{BLOOD_TYPES[info.bloodType] ?? info.bloodType}</Text>
          </View>
        </ScrollView>
        <View style={styles.infoButtonRow}>
          <TouchableOpacity style={styles.activeButton} onPress={handleReportArrival}>
            <Text style={styles.activeButtonText}>{str.triage}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activeButton} onPress={() => setScreenState("active")}>
            <Text style={styles.activeButtonText}>{str.goBack}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
