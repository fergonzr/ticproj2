import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { useApi } from "@/lib/api/useApi";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import OsmMap from "@/lib/map/OsmMap";
import { mobileColors } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, Chip, SwipeBtn } from "@/lib/components/cl";
import { RoutePoint, GeoLocation } from "@/lib/models";
import { haversineMeters, formatDistance } from "@/lib/utils/geo";

const NEAR_ARRIVAL_METERS = 5;
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
  }>();

  const hospitalLocation = useMemo<GeoLocation | null>(() => {
    const lat = parseFloat(params.hospitalLat ?? "");
    const lon = parseFloat(params.hospitalLon ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { latitude: lat, longitude: lon };
  }, [params.hospitalLat, params.hospitalLon]);

  // Tap into the same GPS watcher the EmergencyBrowser uses so the
  // navigation screen reacts to the paramedic moving in real time.
  const locationTracking = useParamedicLocationTracking({
    locationTracker: paramedicLocationTracker,
    updateIntervalMs: 5000,
    distanceInterval: 5,
  });

  const [routePoints, setRoutePoints] = useState<RoutePoint[] | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const lastRouteOriginRef = useRef<GeoLocation | null>(null);

  const destination = hospitalLocation ?? activeEmergency?.location ?? null;

  // Initial route fetch + live refresh as the paramedic moves.
  useEffect(() => {
    if (!destination) return;
    const origin = locationTracking.lastLocation ?? { latitude: 6.168, longitude: -75.592 };
    const last = lastRouteOriginRef.current;
    if (last && haversineMeters(last, origin) < ROUTE_REFRESH_METERS) return;
    lastRouteOriginRef.current = origin;
    let cancelled = false;
    routeProvider
      .getRoute(origin, destination)
      .then((r) => {
        if (cancelled) return;
        setRoutePoints(r.points);
        setEta(r.estimatedMinutes);
        setDistanceKm(r.distanceKm);
      })
      .catch((e) => {
        console.warn("Route fetch failed", e);
      });
    return () => { cancelled = true; };
  }, [destination, locationTracking.lastLocation, routeProvider]);

  const distanceToHospital = useMemo(() => {
    if (!locationTracking.lastLocation || !destination) return null;
    return haversineMeters(locationTracking.lastLocation, destination);
  }, [locationTracking.lastLocation, destination]);

  const isNearArrival =
    distanceToHospital !== null && distanceToHospital < NEAR_ARRIVAL_METERS;

  const handleArrive = () => {
    router.push("/(paramedic)/ParamedicHospitalArrival");
  };

  const subtitle =
    eta !== null
      ? `${eta} min${distanceKm !== null ? ` · ${distanceKm.toFixed(1)} km` : ""}`
      : "Calculando ruta…";

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar
        title={params.hospitalName || "Centro médico"}
        subtitle={subtitle}
        leading={
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="chevron-left" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        }
      />

      {/* Map */}
      <View style={{ flex: 1, position: "relative" }}>
        <OsmMap
          marker={destination}
          paramedicMarker={locationTracking.lastLocation}
          polyline={routePoints}
        />

        {/* Arrival card — switches between "navigating" and "arrived" by GPS distance */}
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
          <ClinicalCard style={{ padding: 14, shadowColor: "#000", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 28, elevation: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <View
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: isNearArrival ? mobileColors.mildBg : mobileColors.primarySoft,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Feather
                  name={isNearArrival ? "map-pin" : "plus-square"}
                  size={18}
                  color={isNearArrival ? mobileColors.mild : mobileColors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }} numberOfLines={1}>
                  {params.hospitalName || "Centro médico"}
                </Text>
                <Text style={{ fontSize: 12, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
                  {isNearArrival
                    ? "Has llegado al hospital — confirma para enviar el reporte."
                    : distanceToHospital !== null
                      ? `${formatDistance(distanceToHospital)} restantes`
                      : "Confirma cuando llegues al hospital"}
                </Text>
              </View>
              {eta !== null && !isNearArrival && (
                <Chip label={`${eta} min`} tone="mild" />
              )}
            </View>
            {isNearArrival ? (
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
          </ClinicalCard>
        </View>
      </View>
    </View>
  );
}
