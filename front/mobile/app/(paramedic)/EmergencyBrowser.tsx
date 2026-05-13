import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Modal,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRouter } from "expo-router";
import { useApi } from "@/lib/api/useApi";
import { useParamedicUser } from "@/lib/hooks/useParamedicUser";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { EmergencyAssignment, RouteInfo, EmergencyCase, GeoLocation, RoutePoint } from "@/lib/models";
import { BLOOD_TYPES } from "@/lib/models";
import OsmMap, { OsmMapHandle } from "@/lib/map/OsmMap";
import { haversineMeters, formatDistance } from "@/lib/utils/geo";
import * as str from "@/lib/strings";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import AppButton from "@/lib/components/AppButton";
import {
  AssignmentAcceptError,
  AssignmentRejectError,
  RouteFetchError,
} from "@/lib/api/errors";
import { mobileColors } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, Chip, SectionLabel, PillButton, SwipeBtn, RejectReasonSheet } from "@/lib/components/cl";

type ScreenState = "idle" | "pending" | "active" | "route" | "onsite" | "info";

function formatAllergies(a?: string[]): string {
  return a && a.length > 0 ? a.join(", ") : str.optionNoneF;
}

const IDLE_PEEK_HEIGHT = 60;

/** Switch the route panel into "arrived" mode below this many meters. */
const NEAR_ARRIVAL_METERS = 5;
/** Re-request the polyline from the routing service when the paramedic has
 *  moved at least this far from the previous origin. Prevents request spam. */
const ROUTE_REFRESH_METERS = 40;

function IdlePanel(): ReactElement {
  const [cardHeight, setCardHeight] = useState(0);
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);
  const maxTranslate = Math.max(0, cardHeight - IDLE_PEEK_HEIGHT);

  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = startY.value + e.translationY;
      translateY.value = Math.max(0, Math.min(maxTranslate, next));
    })
    .onEnd((e) => {
      const shouldCollapse = e.velocityY > 500 || translateY.value > maxTranslate / 2;
      translateY.value = withSpring(shouldCollapse ? maxTranslate : 0, { damping: 18, stiffness: 180 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
      style={[{ position: "absolute", left: 16, right: 16, bottom: 16 }, animStyle]}
    >
      <GestureDetector gesture={pan}>
        <View>
          <ClinicalCard padded={false} style={{ overflow: "hidden" }}>
            {/* Always-visible handle + header (peek area) */}
            <View style={{ alignItems: "center", paddingTop: 10 }}>
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: mobileColors.border, marginBottom: 10 }} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: mobileColors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                <Feather name="bell" size={16} color={mobileColors.primaryDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                  {str.emergencyListTitle}
                </Text>
              </View>
              <Feather name="chevron-down" size={18} color={mobileColors.textSoft} />
            </View>

            {/* Expanded body — slides off-screen when collapsed */}
            <View style={{ paddingHorizontal: 22, paddingBottom: 22, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: mobileColors.textMid, lineHeight: 20, textAlign: "center", fontFamily: "Inter_400Regular" }}>
                {str.noActiveEmergency}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: mobileColors.borderSoft,
                  width: "100%",
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: mobileColors.mild }} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: mobileColors.mild, fontFamily: "Inter_700Bold" }}>
                  Disponible 24/7
                </Text>
              </View>
            </View>
          </ClinicalCard>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function EmergencyBrowser(): ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const { paramedicUser, clearParamedicUser } = useParamedicUser();
  const { paramedicLocationTracker: locationTracker, emergencyAssignmentListener, routeProvider } = useApi();
  const { activeEmergency, setActiveEmergency } = useActiveEmergency();
  const mapRef = useRef<OsmMapHandle>(null);

  const [screenState, setScreenState] = useState<ScreenState>("idle");
  const [pendingAssignment, setPendingAssignment] = useState<EmergencyAssignment | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapMarker, setMapMarker] = useState<GeoLocation | null>(null);
  const [mapPolyline, setMapPolyline] = useState<RoutePoint[] | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const locationTracking = useParamedicLocationTracking({
    locationTracker,
    updateIntervalMs: 10000,
    distanceInterval: 10,
  });

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ title: str.paramedicLabel });
  }, [navigation]);

  const focusOn = useCallback((loc: GeoLocation) => {
    setMapMarker(loc);
    mapRef.current?.centerOn(loc);
  }, []);

  const clearMap = useCallback(() => {
    setMapMarker(null);
    setMapPolyline(null);
  }, []);

  useEffect(() => {
    if (activeEmergency || !paramedicUser) return;
    emergencyAssignmentListener.startListening(
      paramedicUser.id,
      (assignment) => {
        setPendingAssignment(assignment);
        setScreenState("pending");
        focusOn(assignment.emergencyCase.location);
      },
      (reason) => {
        if (reason === "auth_error") Alert.alert(str.alertError, str.alertSessionExpired);
      },
    );
    return () => { emergencyAssignmentListener.stopListening(); };
  }, [activeEmergency, paramedicUser, emergencyAssignmentListener, focusOn]);

  useEffect(() => {
    if (activeEmergency && screenState === "idle") {
      setScreenState("active");
      focusOn(activeEmergency.location);
    }
    if (!activeEmergency && screenState !== "idle" && screenState !== "pending") {
      setScreenState("idle");
      setRouteInfo(null);
      clearMap();
    }
  }, [activeEmergency, screenState, focusOn, clearMap]);

  const handleAccept = useCallback(async () => {
    if (!pendingAssignment) return;
    setIsLoading(true);
    try {
      const confirmed = await emergencyAssignmentListener.acceptAssignment(pendingAssignment.id);
      setActiveEmergency(confirmed);
      setPendingAssignment(null);
      setScreenState("active");
      focusOn(confirmed.location);
    } catch (error) {
      Alert.alert(str.alertError, error instanceof AssignmentAcceptError ? str.alertAssignmentAcceptError : str.alertError);
    } finally {
      setIsLoading(false);
    }
  }, [pendingAssignment, emergencyAssignmentListener, setActiveEmergency, focusOn]);

  const handleReject = useCallback(async (payload?: { reason: string; notes: string }) => {
    if (!pendingAssignment) return;
    // TODO(backend): forward `payload.reason`/`payload.notes` once the port accepts them.
    if (payload) console.info("Reject reason:", payload.reason, payload.notes || "(no notes)");
    try {
      await emergencyAssignmentListener.rejectAssignment(pendingAssignment.id);
    } catch (error) {
      Alert.alert(str.alertError, error instanceof AssignmentRejectError ? str.alertAssignmentRejectError : str.alertError);
    }
    setPendingAssignment(null);
    setScreenState("idle");
    setRejectModalOpen(false);
    clearMap();
  }, [pendingAssignment, emergencyAssignmentListener, clearMap]);

  const lastRouteOriginRef = useRef<GeoLocation | null>(null);

  const handleRoute = useCallback(async () => {
    if (!activeEmergency) return;
    setIsLoading(true);
    try {
      const origin =
        locationTracking.lastLocation ??
        { latitude: 6.168, longitude: -75.592 };
      const route = await routeProvider.getRoute(origin, activeEmergency.location);
      setRouteInfo(route);
      setScreenState("route");
      setMapPolyline(route.points);
      lastRouteOriginRef.current = origin;
      if (route.points.length > 0) {
        mapRef.current?.fitToCoordinates(route.points);
      }
    } catch (error) {
      Alert.alert(str.alertError, error instanceof RouteFetchError ? str.alertRouteFetchError : str.alertError);
    } finally {
      setIsLoading(false);
    }
  }, [activeEmergency, routeProvider, locationTracking.lastLocation]);

  // Live route refresh + 5m arrival detection.
  // Triggers from every GPS update while in `route` state:
  //  - re-fetches polyline if the paramedic has moved past ROUTE_REFRESH_METERS
  //  - auto-shows the arrival swipe card when distance < NEAR_ARRIVAL_METERS
  const distanceToEmergency = useMemo(() => {
    if (!locationTracking.lastLocation || !activeEmergency) return null;
    return haversineMeters(
      locationTracking.lastLocation,
      activeEmergency.location,
    );
  }, [locationTracking.lastLocation, activeEmergency]);

  const isNearArrival =
    distanceToEmergency !== null && distanceToEmergency < NEAR_ARRIVAL_METERS;

  useEffect(() => {
    if (screenState !== "route") return;
    if (!locationTracking.lastLocation || !activeEmergency) return;
    const last = lastRouteOriginRef.current;
    if (last) {
      const moved = haversineMeters(last, locationTracking.lastLocation);
      if (moved < ROUTE_REFRESH_METERS) return;
    }
    const origin = locationTracking.lastLocation;
    lastRouteOriginRef.current = origin;
    routeProvider
      .getRoute(origin, activeEmergency.location)
      .then((route) => {
        setRouteInfo(route);
        setMapPolyline(route.points);
      })
      .catch((e) => {
        // Routing service may be offline (GraphHopper); keep the previous
        // polyline so the user still has a visual reference.
        console.warn("Route refresh failed", e);
      });
  }, [screenState, locationTracking.lastLocation, activeEmergency, routeProvider]);

  const handleCall = useCallback(() => {
    if (!activeEmergency?.medicalInfo.phone) return;
    Linking.openURL(`tel:${activeEmergency.medicalInfo.phone}`);
  }, [activeEmergency]);

  const handleInfo = useCallback(() => { setScreenState("info"); }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Cerrar sesión",
      "¿Deseas cerrar tu sesión de paramédico?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              emergencyAssignmentListener.stopListening();
              await clearParamedicUser();
              router.replace("/(paramedic)/LoginScreen");
            } catch (e) {
              console.warn("Logout failed", e);
            }
          },
        },
      ],
    );
  }, [clearParamedicUser, router, emergencyAssignmentListener]);

  const handleReportArrival = useCallback(async () => {
    if (!activeEmergency) return;
    try { await emergencyAssignmentListener.reportArrival(); }
    catch (e) { console.warn("Failed to report arrival to backend", e); }
    setScreenState("onsite");
    // Clear map overlays after the screen transition to avoid a native
    // react-native-maps crash when Polyline unmounts during animation.
    setTimeout(() => {
      setRouteInfo(null);
      setMapPolyline(null);
    }, 300);
  }, [activeEmergency, emergencyAssignmentListener]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      {/* Reject reason modal */}
      <RejectReasonSheet
        visible={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={(payload) => handleReject(payload)}
      />

      {/* Location error modal */}
      <Modal backdropColor={mobileColors.text} animationType="fade" visible={locationTracking.error !== null} transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(11,22,32,0.6)", alignItems: "center", justifyContent: "center" }}>
          <ClinicalCard style={{ margin: 32, gap: 12 }}>
            <Text style={{ fontWeight: "700", fontSize: 18, color: mobileColors.text, fontFamily: "Inter_700Bold" }}>
              {str.alertError}
            </Text>
            <Text style={{ fontSize: 14, color: mobileColors.textMid, fontFamily: "Inter_400Regular" }}>
              {str.alertLocationTrackerError}
            </Text>
            <AppButton title={str.proptToSettings} onPress={() => Linking.openSettings()} />
          </ClinicalCard>
        </View>
      </Modal>

      <View style={{ flex: 1 }}>
        {/* AppBar — paramedic identity + online indicator (not shown over info screen) */}
        {screenState !== "info" && (
          <AppBar
            title={str.paramedicLabel}
            subtitle={paramedicUser?.name ?? undefined}
            leading={
              <TouchableOpacity onPress={handleLogout} hitSlop={8} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                <Feather name="log-out" size={20} color={mobileColors.text} />
              </TouchableOpacity>
            }
            trailing={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: mobileColors.mild }} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: mobileColors.mild, fontFamily: "Inter_700Bold" }}>
                  EN LÍNEA
                </Text>
              </View>
            }
          />
        )}

        {/* Map (always rendered underneath) */}
        {screenState !== "info" && (
          <View style={{ flex: 1 }}>
            <OsmMap ref={mapRef} marker={mapMarker} polyline={mapPolyline} />
          </View>
        )}

        {/* Route banner */}
        {screenState === "route" && routeInfo && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: mobileColors.primaryDeep,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Feather name="navigation" size={16} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Inter_600SemiBold" }}>
                Hacia
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>
                {routeInfo.destinationLabel}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", fontFamily: "Inter_800ExtraBold" }}>
                {routeInfo.estimatedMinutes} min
              </Text>
              <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }}>
                {routeInfo.distanceKm} km
              </Text>
            </View>
          </View>
        )}

        {/* State panels */}
        {screenState === "idle"    && <IdlePanel />}
        {screenState === "pending" && renderPendingPanel()}
        {screenState === "active"  && activeEmergency && renderActivePanel(activeEmergency)}
        {screenState === "route"   && renderRoutePanel()}
        {screenState === "onsite"  && activeEmergency && renderOnSitePanel(activeEmergency)}
        {screenState === "info"    && activeEmergency && renderInfoPanel(activeEmergency)}
      </View>
    </SafeAreaView>
  );

  // ─── Panel renderers ────────────────────────────────────────────────────────

  function renderPendingPanel(): ReactElement {
    const ec = pendingAssignment?.emergencyCase;
    const shortId = pendingAssignment?.id.split("-").pop() ?? "—";
    return (
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
        <ClinicalCard
          padded={false}
          style={{ overflow: "hidden", borderColor: mobileColors.critical, borderWidth: 2 }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: mobileColors.criticalBg,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: mobileColors.critical,
              }}
            />
            <Text style={{ flex: 1, fontSize: 11, fontWeight: "800", color: mobileColors.critical, letterSpacing: 0.8, fontFamily: "Inter_800ExtraBold" }}>
              {str.alertLabel} · ALT-{shortId}
            </Text>
          </View>

          {/* Body */}
          <View style={{ padding: 16, gap: 14 }}>
            {ec && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: mobileColors.criticalBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="alert-circle" size={21} color={mobileColors.critical} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                    {ec.medicalInfo.firstName} {ec.medicalInfo.lastName}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Feather name="map-pin" size={12} color={mobileColors.textSoft} />
                    <Text style={{ fontSize: 12, color: mobileColors.textMid, fontFamily: "Inter_400Regular" }}>
                      {ec.location.latitude.toFixed(4)}, {ec.location.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
                <Chip label="Crítico" tone="critical" icon="zap" />
              </View>
            )}

            {/* Bidirectional swipe — left rejects, right accepts */}
            <SwipeBtn
              label="Desliza para responder"
              bidir
              color={mobileColors.mild}
              leftColor={mobileColors.critical}
              disabled={isLoading}
              onSwipeRight={handleAccept}
              onSwipeLeft={() => setRejectModalOpen(true)}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: -4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Feather name="arrow-left" size={12} color={mobileColors.critical} />
                <Text style={{ fontSize: 11, fontWeight: "700", color: mobileColors.critical, fontFamily: "Inter_700Bold" }}>
                  Rechazar
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: mobileColors.mild, fontFamily: "Inter_700Bold" }}>
                  Aceptar
                </Text>
                <Feather name="arrow-right" size={12} color={mobileColors.mild} />
              </View>
            </View>
          </View>
        </ClinicalCard>
      </View>
    );
  }

  function renderActivePanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
        <ClinicalCard padded={false} style={{ overflow: "hidden" }}>
          {/* Dark header */}
          <View
            style={{
              backgroundColor: mobileColors.primaryDeep,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Feather name="alert-circle" size={16} color="#fff" />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "700", color: "#fff", letterSpacing: 0.3, fontFamily: "Inter_700Bold" }}>
              {str.alertLabel} #1 · Crítico
            </Text>
            <Chip label={`${emergency.location.latitude.toFixed(2)}`} tone="dark" icon="map-pin" />
          </View>

          {/* Patient row */}
          <View style={{ padding: 14, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: mobileColors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: mobileColors.primaryDeep, fontFamily: "Inter_800ExtraBold" }}>
                {(info.firstName.charAt(0) + info.lastName.charAt(0)).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                {info.firstName} {info.lastName}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {info.phone ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="phone" size={12} color={mobileColors.textSoft} />
                    <Text style={{ fontSize: 12, color: mobileColors.textMid, fontFamily: "Inter_400Regular" }}>{info.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              onPress={handleCall}
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                backgroundColor: mobileColors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="phone" size={18} color={mobileColors.primaryDeep} />
            </TouchableOpacity>
          </View>

          {/* Swipe to route + info button */}
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
            <SwipeBtn
              label="Desliza para enrutar"
              icon="navigation"
              color={mobileColors.primary}
              disabled={isLoading}
              onSwipeRight={handleRoute}
            />
            <TouchableOpacity
              onPress={handleInfo}
              style={{
                height: 44,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: mobileColors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
              }}
            >
              <Feather name="user" size={15} color={mobileColors.primary} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: mobileColors.primary, fontFamily: "Inter_700Bold" }}>
                {str.patientInfo}
              </Text>
            </TouchableOpacity>
          </View>
        </ClinicalCard>
      </View>
    );
  }

  function renderRoutePanel(): ReactElement {
    return (
      <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
        <ClinicalCard style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: mobileColors.mildBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather
                name={isNearArrival ? "map-pin" : "navigation"}
                size={22}
                color={isNearArrival ? mobileColors.mild : mobileColors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                {isNearArrival ? "Has llegado al lugar" : "Navegando al sitio"}
              </Text>
              <Text style={{ fontSize: 12, color: mobileColors.textMid, fontFamily: "Inter_400Regular" }}>
                {isNearArrival
                  ? "Confirma tu llegada para comenzar la atención."
                  : distanceToEmergency !== null
                    ? `${formatDistance(distanceToEmergency)} restantes — confirma al llegar.`
                    : "Esperando GPS…"}
              </Text>
            </View>
          </View>
          {isNearArrival ? (
            <SwipeBtn
              label="Desliza para confirmar llegada"
              icon="check"
              color={mobileColors.mild}
              onSwipeRight={handleReportArrival}
            />
          ) : (
            <View
              style={{
                height: 62,
                borderRadius: 999,
                backgroundColor: mobileColors.primaryTint,
                borderWidth: 1.5,
                borderColor: mobileColors.primarySoft,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: 0.85,
              }}
            >
              <Feather name="navigation" size={16} color={mobileColors.primaryDeep} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: mobileColors.primaryDeep,
                  letterSpacing: 0.3,
                  fontFamily: "Inter_700Bold",
                }}
              >
                Acércate a menos de {NEAR_ARRIVAL_METERS} m
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => setScreenState("active")}
            style={{
              marginTop: 10,
              height: 44,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: mobileColors.primary,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Feather name="arrow-left" size={16} color={mobileColors.primary} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: mobileColors.primary, fontFamily: "Inter_700Bold" }}>
              Volver
            </Text>
          </TouchableOpacity>
        </ClinicalCard>
      </View>
    );
  }

  function renderOnSitePanel(emergency: EmergencyCase): ReactElement {
    const patientName = `${emergency.medicalInfo.firstName} ${emergency.medicalInfo.lastName}`.trim();
    const shortId = emergency.id?.split("-").pop() ?? "—";
    const actions: {
      icon: keyof typeof Feather.glyphMap;
      label: string;
      desc: string;
      color: string;
      bg: string;
      onPress: () => void;
    }[] = [
      {
        icon: "user",
        label: "Info del paciente",
        desc: "Ver historial médico completo",
        color: mobileColors.primary,
        bg: mobileColors.primarySoft,
        onPress: () => setScreenState("info"),
      },
      {
        icon: "file-text",
        label: "Reporte de caso",
        desc: "Llenar informe de atención",
        color: mobileColors.blue,
        bg: mobileColors.blueBg,
        onPress: () => router.push("/(paramedic)/PrehospitalCareReport"),
      },
      {
        // Goes to ComplexityAssignment first (triage), which routes onward to
        // MedicalCenterTransfer once a complexity level is assigned.
        icon: "truck",
        label: "Enrutar al hospital",
        desc: "Triaje rápido y selección del centro médico",
        color: mobileColors.mild,
        bg: mobileColors.mildBg,
        onPress: () => router.push("/(paramedic)/ComplexityAssignment"),
      },
    ];

    return (
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.1,
          shadowRadius: 28,
          elevation: 12,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 18,
        }}
      >
        <View
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            backgroundColor: mobileColors.border,
            alignSelf: "center",
            marginBottom: 12,
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: "700",
              color: mobileColors.textSoft,
              letterSpacing: 0.3,
              fontFamily: "Inter_700Bold",
            }}
            numberOfLines={1}
          >
            En sitio · ALT-{shortId}{patientName ? ` · ${patientName}` : ""}
          </Text>
          <Chip label="ACTIVO" tone="primary" size="sm" />
        </View>

        <View style={{ gap: 10 }}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={a.onPress}
              activeOpacity={0.85}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: a.bg,
                borderWidth: 1,
                borderColor: `${a.color}22`,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.07,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Feather name={a.icon} size={20} color={a.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                  {a.label}
                </Text>
                <Text style={{ fontSize: 11, color: mobileColors.textMid, marginTop: 1, fontFamily: "Inter_400Regular" }}>
                  {a.desc}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={a.color} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderInfoPanel(emergency: EmergencyCase): ReactElement {
    const info = emergency.medicalInfo;
    return (
      <View style={{ position: "absolute", inset: 0, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: mobileColors.bg }}>
        <AppBar
          title="Información del paciente"
          subtitle={`${str.alertLabel} #1`}
          leading={
            <TouchableOpacity onPress={() => setScreenState("active")}>
              <Feather name="chevron-left" size={22} color={mobileColors.text} />
            </TouchableOpacity>
          }
          trailing={
            <TouchableOpacity onPress={handleCall}>
              <Feather name="phone" size={20} color={mobileColors.primary} />
            </TouchableOpacity>
          }
        />

        {/* Hero */}
        <View
          style={{
            backgroundColor: mobileColors.primaryDeep,
            paddingHorizontal: 20,
            paddingVertical: 18,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff", fontFamily: "Inter_800ExtraBold" }}>
                {(info.firstName.charAt(0) + info.lastName.charAt(0)).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.3, fontFamily: "Inter_900Black" }}>
                {info.firstName} {info.lastName}
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_400Regular" }}>
                {info.age} años · {BLOOD_TYPES[info.bloodType] ?? info.bloodType}
              </Text>
            </View>
            <Chip label="Crítico" tone="critical" icon="zap" />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { icon: "droplet" as const, val: BLOOD_TYPES[info.bloodType] ?? info.bloodType, label: "Sangre", warn: false },
              { icon: "alert-circle" as const, val: String(info.allergies.length), label: "Alergias", warn: false },
              { icon: "heart" as const, val: info.hasPacemaker ? "SÍ" : "NO", label: "Marcapasos", warn: !!info.hasPacemaker },
            ].map((v) => (
              <View
                key={v.label}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  padding: 10,
                  backgroundColor: v.warn ? "rgba(255,80,80,0.22)" : "rgba(255,255,255,0.12)",
                  borderWidth: v.warn ? 1 : 0,
                  borderColor: v.warn ? "rgba(255,80,80,0.35)" : "transparent",
                }}
              >
                <Feather name={v.icon} size={15} color={v.warn ? "#FFB3B3" : "#fff"} />
                <Text style={{ fontSize: 21, fontWeight: "900", marginTop: 5, color: v.warn ? "#FFD1D1" : "#fff", fontFamily: "Inter_900Black" }}>
                  {v.val}
                </Text>
                <Text style={{ fontSize: 9, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: v.warn ? "#FFD1D1" : "rgba(255,255,255,0.8)", fontFamily: "Inter_700Bold" }}>
                  {v.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          {info.allergies.length > 0 && (
            <View>
              <SectionLabel>Alergias</SectionLabel>
              <Text style={{ fontSize: 14, color: mobileColors.textMid, fontFamily: "Inter_400Regular" }}>
                {formatAllergies(info.allergies)}
              </Text>
            </View>
          )}
          {info.diseases && info.diseases.length > 0 && (
            <View>
              <SectionLabel>Enfermedades preexistentes</SectionLabel>
              <Text style={{ fontSize: 14, color: mobileColors.textMid, fontFamily: "Inter_400Regular" }}>
                {info.diseases.join(", ")}
              </Text>
            </View>
          )}
          <ClinicalCard padded={false}>
            {[
              [str.labelPhone, info.phone || "—"],
              [str.labelIDType, `${DOCUMENT_TYPES_LABELS[info.documentType] ?? info.documentType}: ${info.documentNumber}`],
            ].map(([label, value], i, arr) => (
              <View
                key={label}
                style={{
                  flexDirection: "row",
                  padding: 10,
                  paddingHorizontal: 14,
                  borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                  borderBottomColor: mobileColors.borderSoft,
                }}
              >
                <Text style={{ width: 88, fontSize: 12, color: mobileColors.textSoft, fontWeight: "600", fontFamily: "Inter_600SemiBold" }}>
                  {label}
                </Text>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: mobileColors.text, fontFamily: "Inter_700Bold" }}>
                  {value}
                </Text>
              </View>
            ))}
          </ClinicalCard>

          <PillButton label={str.goBack} variant="outline" full size="lg" onPress={() => setScreenState("active")} />
        </ScrollView>
      </View>
    );
  }
}

const DOCUMENT_TYPES_LABELS: Record<string, string> = {
  NATIONAL_ID: "CC",
  PASSPORT: "Pasaporte",
  IDENTITY_CARD: "TI",
};
