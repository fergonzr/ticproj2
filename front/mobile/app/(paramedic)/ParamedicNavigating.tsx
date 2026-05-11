import { ReactElement, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { useApi } from "@/lib/api/useApi";
import OsmMap from "@/lib/map/OsmMap";
import { mobileColors } from "@/lib/themes/mobileTokens";
import { ClinicalCard, Chip, SwipeBtn } from "@/lib/components/cl";
import { RoutePoint } from "@/lib/models";

export default function ParamedicNavigating(): ReactElement {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { activeEmergency } = useActiveEmergency();
  const { routeProvider } = useApi();
  const { hospitalName } = useLocalSearchParams<{ hospitalId?: string; hospitalName?: string }>();

  const [routePoints, setRoutePoints] = useState<RoutePoint[] | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    if (!activeEmergency) return;
    let cancelled = false;
    routeProvider
      .getRoute(
        { latitude: 6.168, longitude: -75.592 },
        activeEmergency.location,
      )
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
  }, [activeEmergency, routeProvider]);

  const handleArrive = () => {
    router.push("/(paramedic)/ParamedicHospitalArrival");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1620" }}>
      {/* Dark top navigation bar */}
      <View style={{ paddingTop: top + 6, paddingHorizontal: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.1)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Feather name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View
          style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.1)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Feather name="arrow-up-right" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11, opacity: 0.7, fontWeight: "600",
              textTransform: "uppercase", letterSpacing: 0.5,
              color: "#fff", fontFamily: "Inter_600SemiBold",
            }}
          >
            Continúa por
          </Text>
          <Text
            style={{
              fontSize: 18, fontWeight: "800", color: "#fff",
              fontFamily: "Inter_800ExtraBold",
            }}
            numberOfLines={1}
          >
            Vía al destino
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff", fontFamily: "Inter_900Black" }}>
            {eta !== null ? `${eta} min` : "—"}
          </Text>
          <Text style={{ fontSize: 11, opacity: 0.7, color: "#fff", fontFamily: "Inter_400Regular" }}>
            {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : ""}
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={{ flex: 1, position: "relative" }}>
        <OsmMap
          marker={activeEmergency?.location ?? null}
          polyline={routePoints}
        />

        {/* Arrival swipe card */}
        <View style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
          <ClinicalCard style={{ padding: 14, shadowColor: "#000", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 28, elevation: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <View
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: mobileColors.primarySoft,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Feather name="plus-square" size={18} color={mobileColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }} numberOfLines={1}>
                  {hospitalName || "Centro médico"}
                </Text>
                <Text style={{ fontSize: 12, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
                  Confirma cuando llegues al hospital
                </Text>
              </View>
              <Chip label={eta !== null ? `${eta} min` : "—"} tone="mild" />
            </View>
            <SwipeBtn
              label="Desliza al llegar al hospital"
              icon="check"
              color={mobileColors.mild}
              onSwipeRight={handleArrive}
            />
          </ClinicalCard>
        </View>
      </View>
    </View>
  );
}
