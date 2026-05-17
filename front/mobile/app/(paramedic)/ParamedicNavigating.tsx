import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, Linking, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { useApi } from "@/lib/api/useApi";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import OsmMap from "@/lib/map/OsmMap";
import { mobileColors } from "@/lib/themes/mobileTokens";
import * as str from "@/lib/strings";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { AppBar, ClinicalCard, Chip, SwipeBtn } from "@/lib/components/cl";
import { RoutePoint, GeoLocation } from "@/lib/models";
import { haversineMeters } from "@/lib/utils/geo";

const NEAR_ARRIVAL_METERS = 50;
const ROUTE_REFRESH_METERS = 40;

export default function ParamedicNavigating(): ReactElement {
  const router = useRouter();
  const { activeEmergency } = useActiveEmergency();
  const { routeProvider, paramedicLocationTracker } = useApi();
  const params = useLocalSearchParams<{
    hospitalId?: string;
    hospitalName?: string;
    hospitalLat?: string;
    hospitalLon?: string;
    hospitalPhone?: string;
  }>();

  // The transfer to the hospital is already committed by this point, so
  // the back navigation is disabled both visually (no chevron) and at the
  // OS level (Android hardware back). Cancelling the emergency is the
  // intentional way out, via the action button below.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  console.log("Emergency");
  console.log(activeEmergency);

  const hospitalLocation = useMemo<GeoLocation | null>(() => {
    const lat = parseFloat(params.hospitalLat ?? "");
    const lon = parseFloat("Emergency");
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { latitude: lat, longitude: lon };
  }, [params.hospitalLat, params.hospitalLon]);

  // Tap into the same GPS watcher the EmergencyBrowser uses so the
  // navigation screen reacts to the paramedic moving in real time.
  const locationTracking = useParamedicLocationTracking({
    locationTracker: paramedicLocationTracker,
    updateIntervalMs: 5000,
    // 0 = no movement gate; emit a tick every updateIntervalMs even when
    // stationary so the operator's watch keeps receiving updates.
    distanceInterval: 0,
  });

  const [routePoints, setRoutePoints] = useState<RoutePoint[] | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [routeError, setRouteError] = useState(false);
  const lastRouteOriginRef = useRef<GeoLocation | null>(null);

  const destination = hospitalLocation ?? activeEmergency?.location ?? null;

  // Initial route fetch + live refresh as the paramedic moves. The route
  // always starts from the paramedic's real GPS position, so it waits for
  // the first fix instead of routing from a fixed coordinate. `lastRouteOriginRef`
  // is only updated on success, so a failed request will retry on the next
  // GPS update instead of getting stuck behind the 40m gate.
  useEffect(() => {
    if (!destination) return;
    const origin = locationTracking.lastLocation;
    if (!origin) return;
    const last = lastRouteOriginRef.current;
    if (last && haversineMeters(last, origin) < ROUTE_REFRESH_METERS) return;
    let cancelled = false;
    routeProvider
      .getRoute(origin, destination)
      .then((r) => {
        if (cancelled) return;
        lastRouteOriginRef.current = origin;
        setRoutePoints(r.points);
        setEta(r.estimatedMinutes);
        setDistanceKm(r.distanceKm);
        setRouteError(false);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("Route fetch failed", e);
        setRouteError(true);
      });
    return () => { cancelled = true; };
  }, [destination, locationTracking.lastLocation, routeProvider]);

  const distanceToHospital = useMemo(() => {
    if (!locationTracking.lastLocation || !destination) return null;
    return haversineMeters(locationTracking.lastLocation, destination);
  }, [locationTracking.lastLocation, destination]);

  const isNearArrival =
    distanceToHospital !== null && distanceToHospital < NEAR_ARRIVAL_METERS;

  // Collapsible card — drag the handle down to tuck away the action buttons
  // while keeping the handle, header, and arrival action visible. Same
  // pan-gesture pattern as IdlePanel in EmergencyBrowser.
  const [cardHeight, setCardHeight] = useState(0);
  const [peekHeight, setPeekHeight] = useState(0);
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);
  const maxTranslate = Math.max(0, cardHeight - peekHeight);

  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = startY.value + e.translationY;
      translateY.value = Math.max(0, Math.min(maxTranslate, next));
    })
    .onEnd((e) => {
      const shouldCollapse =
        e.velocityY > 500 || translateY.value > maxTranslate / 2;
      translateY.value = withSpring(shouldCollapse ? maxTranslate : 0, {
        damping: 18,
        stiffness: 180,
      });
    });

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleArrive = () => {
    router.push("/(paramedic)/ParamedicHospitalArrival");
  };

  const handleCallHospital = () => {
    const phone = params.hospitalPhone?.trim();
    if (!phone) {
      Alert.alert("Sin teléfono", "No hay un número del centro médico disponible.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Error", "No se pudo iniciar la llamada.");
    });
  };

  const handleCallOperator = () => {
    Linking.openURL(`tel:${str.dispatchPhoneNumber}`).catch(() => {
      Alert.alert("Error", "No se pudo iniciar la llamada.");
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar title={params.hospitalName || "Centro médico"} />

      {/* Map */}
      <View style={{ flex: 1, position: "relative" }}>
        <OsmMap
          marker={destination}
          paramedicMarker={locationTracking.lastLocation}
          polyline={routePoints}
        />

        {/* Arrival card — collapsible. Peek zone (handle + header + arrival
            action) stays visible; the action buttons tuck away when the
            paramedic drags the handle down. */}
        <Animated.View
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
          style={[
            { position: "absolute", left: 12, right: 12, bottom: 12 },
            cardAnimStyle,
          ]}
        >
          <ClinicalCard
            padded={false}
            style={{
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.18,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 28,
              elevation: 12,
            }}
          >
            {/* Peek zone — always visible */}
            <View onLayout={(e) => setPeekHeight(e.nativeEvent.layout.height)}>
              {/* Drag handle + header — the pan-gesture grab area */}
              <GestureDetector gesture={pan}>
                <View>
                  <View style={{ alignItems: "center", paddingTop: 10 }}>
                    <View
                      style={{
                        width: 38,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: mobileColors.border,
                        marginBottom: 10,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingHorizontal: 14,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: isNearArrival
                          ? mobileColors.mildBg
                          : mobileColors.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather
                        name={isNearArrival ? "map-pin" : "plus-square"}
                        size={18}
                        color={isNearArrival ? mobileColors.mild : mobileColors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: mobileColors.text,
                          fontFamily: "Inter_800ExtraBold",
                        }}
                        numberOfLines={1}
                      >
                        {params.hospitalName || "Centro médico"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: mobileColors.textSoft,
                          fontFamily: "Inter_400Regular",
                        }}
                      >
                        {isNearArrival
                          ? "Has llegado al hospital — confirma para enviar el reporte."
                          : routeError
                            ? "No se pudo calcular la ruta — reintentando…"
                            : distanceKm !== null
                              ? `${distanceKm.toFixed(1)} km restantes`
                              : "Calculando ruta…"}
                      </Text>
                    </View>
                    {eta !== null && !isNearArrival && (
                      <Chip label={`${eta} min`} tone="mild" />
                    )}
                  </View>
                </View>
              </GestureDetector>

              {/* Arrival action — stays in the peek so it is reachable even
                  when the card is collapsed. Outside the GestureDetector so
                  the horizontal SwipeBtn does not fight the vertical drag. */}
              <View style={{ paddingHorizontal: 14 }}>
                {activeEmergency?.prehospitalCareReportSent ? (
                  isNearArrival ? (
                    <SwipeBtn
                      label="Desliza al llegar al hospital"
                      icon="check"
                      color={mobileColors.mild}
                      onSwipeRight={handleArrive}
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
                      <Feather
                        name="navigation"
                        size={16}
                        color={mobileColors.primaryDeep}
                      />
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
                  )
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push("/(paramedic)/PrehospitalCareReport")}
                    style={{
                      height: 62,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: mobileColors.blue,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    <Feather name="file-text" size={18} color={mobileColors.blue} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: mobileColors.blue,
                        fontFamily: "Inter_700Bold",
                      }}
                    >
                      Reporte de caso
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Collapsible body — the secondary action buttons */}
            <View
              style={{
                paddingHorizontal: 14,
                paddingTop: 10,
                paddingBottom: 14,
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push("/(paramedic)/ComplexityAssignment")}
                style={{
                  height: 44,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: mobileColors.urgent,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Feather name="activity" size={15} color={mobileColors.urgent} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: mobileColors.urgent,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  {str.complexityScreenTitle}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCallHospital}
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
                <Feather name="phone" size={15} color={mobileColors.primary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: mobileColors.primary,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Llamar al hospital
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCallOperator}
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
                <Feather name="phone" size={15} color={mobileColors.primary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: mobileColors.primary,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  {str.paramedicCallDispatch}
                </Text>
              </TouchableOpacity>
            </View>
          </ClinicalCard>
        </Animated.View>
      </View>
    </View>
  );
}
