import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useApi } from "@/lib/api/useApi";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import { MedicalCenter, RoutePoint } from "@/lib/models";
import * as str from "@/lib/strings";
import { mobileColors } from "@/lib/themes/mobileTokens";
import OsmMap, { OsmMapHandle } from "@/lib/map/OsmMap";
import { AppBar, SwipeBtn } from "@/lib/components/cl";
import { geocodeAddress, isGeocodingAvailable, GeocodeResult } from "@/lib/utils/geocoding";

export default function MedicalCenterTransfer(): ReactElement {
  const router = useRouter();
  const { emergencyAssignmentListener, routeProvider, paramedicLocationTracker } = useApi();
  const { activeEmergency } = useActiveEmergency();
  const { bottom } = useSafeAreaInsets();
  const mapRef = useRef<OsmMapHandle>(null);

  const [centers, setCenters] = useState<MedicalCenter[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [routePoints, setRoutePoints] = useState<RoutePoint[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);

  const locationTracking = useParamedicLocationTracking({
    locationTracker: paramedicLocationTracker,
    updateIntervalMs: 5000,
    // 0 = no movement gate; emit a tick every updateIntervalMs even when
    // stationary so the operator's watch keeps receiving updates.
    distanceInterval: 0,
  });

  useEffect(() => {
    if (!activeEmergency?.id) return;
    let cancelled = false;
    emergencyAssignmentListener
      .getMedicalCenterRecommendations(activeEmergency.id)
      .then((list) => {
        if (cancelled) return;
        setCenters(list);
        if (list.length > 0) setSelectedId((prev) => prev ?? list[0].id);
      })
      .catch((e) => {
        if (cancelled) return;
        Alert.alert(str.alertError, str.transferLoadError);
        console.warn("Medical center fetch failed", e);
        setCenters([]);
      });
    return () => { cancelled = true; };
  }, [activeEmergency?.id, emergencyAssignmentListener]);

  const selected = centers?.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const origin = locationTracking.lastLocation;
    if (!selected || !origin) { setRoutePoints(null); return; }
    let cancelled = false;
    routeProvider
      .getRoute(origin, selected.location)
      .then((r) => {
        if (cancelled) return;
        setRoutePoints(r.points);
        if (r.points.length > 0) mapRef.current?.fitToCoordinates(r.points);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("Route preview failed", e);
        setRoutePoints(null);
      });
    return () => { cancelled = true; };
  }, [selected, locationTracking.lastLocation, routeProvider]);

  const handleStartRoute = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await emergencyAssignmentListener.transferEmergency(selectedId);
      router.push({
        pathname: "/(paramedic)/ParamedicNavigating",
        params: {
          hospitalId: selectedId,
          hospitalName: selected?.name ?? "",
          hospitalLat: selected ? String(selected.location.latitude) : "",
          hospitalLon: selected ? String(selected.location.longitude) : "",
          hospitalPhone: selected?.phone ?? "",
        },
      });
    } catch (e) {
      Alert.alert(str.alertError, String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = useCallback(async () => {
    setSearching(true);
    try {
      setSearchResults(await geocodeAddress(searchQuery));
    } catch (e) {
      console.warn("Geocoding failed", e);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handlePickSearchResult = (result: GeocodeResult) => {
    mapRef.current?.centerOn(result.location);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar
        title={str.transferScreenTitle}
        subtitle={selected?.name ?? str.transferScreenSubtitle}
        leading={
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="chevron-left" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        }
        trailing={
          <TouchableOpacity
            onPress={() => setSearchOpen(true)}
            hitSlop={8}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="search" size={20} color={mobileColors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1 }}>
        <OsmMap
          ref={mapRef}
          marker={selected?.location ?? null}
          paramedicMarker={locationTracking.lastLocation}
          polyline={routePoints}
        />
      </View>

      <View
        style={{
          backgroundColor: mobileColors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.12,
          shadowRadius: 28,
          elevation: 12,
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

        {centers === null ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator color={mobileColors.primary} />
          </View>
        ) : centers.length === 0 ? (
          <Text style={{ textAlign: "center", paddingVertical: 24, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
            {str.transferEmptyState}
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            {centers.map((mc) => {
              const active = selectedId === mc.id;
              return (
                <TouchableOpacity
                  key={mc.id}
                  onPress={() => setSelectedId(mc.id)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: active ? mobileColors.primary : mobileColors.border,
                    backgroundColor: active ? mobileColors.primaryTint : mobileColors.surface,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: active ? mobileColors.primary : mobileColors.bg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="plus-square" size={16} color={active ? "#fff" : mobileColors.textSoft} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: mobileColors.text, fontFamily: "Inter_700Bold" }} numberOfLines={1}>
                      {mc.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: mobileColors.textSoft, marginTop: 1, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
                      {mc.specialties.length > 0 ? mc.specialties.slice(0, 2).join(" · ") : "Atención general"}
                      {mc.availableSlots !== null ? ` · ${mc.availableSlots} cupos` : ""}
                    </Text>
                  </View>
                  {active && <Feather name="check" size={18} color={mobileColors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <SwipeBtn
          label="Desliza para iniciar ruta"
          icon="navigation"
          color={mobileColors.primary}
          disabled={!selectedId || submitting}
          onSwipeRight={handleStartRoute}
        />

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 10, alignSelf: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: mobileColors.textMid, fontFamily: "Inter_700Bold" }}>
            o <Text style={{ color: mobileColors.primary }}>Paciente atendido en sitio</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={searchOpen} animationType="slide" transparent onRequestClose={() => setSearchOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(11,22,32,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: mobileColors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: bottom + 20,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                {str.transferSearchTitle}
              </Text>
              <TouchableOpacity onPress={() => setSearchOpen(false)} hitSlop={8}>
                <Feather name="x" size={22} color={mobileColors.textSoft} />
              </TouchableOpacity>
            </View>

            {isGeocodingAvailable() ? (
              <>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={str.transferSearchPlaceholder}
                    placeholderTextColor={mobileColors.textSoft}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: mobileColors.border,
                      paddingHorizontal: 14,
                      fontSize: 14,
                      color: mobileColors.text,
                      fontFamily: "Inter_400Regular",
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleSearch}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: mobileColors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {searching ? <ActivityIndicator color="#fff" /> : <Feather name="search" size={18} color="#fff" />}
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 240 }} contentContainerStyle={{ gap: 6 }}>
                  {searchResults.length === 0 ? (
                    <Text style={{ textAlign: "center", paddingVertical: 16, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
                      {str.transferSearchEmpty}
                    </Text>
                  ) : (
                    searchResults.map((r, i) => (
                      <TouchableOpacity
                        key={`${r.label}-${i}`}
                        onPress={() => handlePickSearchResult(r)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: mobileColors.border,
                        }}
                      >
                        <Feather name="map-pin" size={16} color={mobileColors.primary} />
                        <Text style={{ flex: 1, fontSize: 13, color: mobileColors.text, fontFamily: "Inter_400Regular" }}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              <Text style={{ paddingVertical: 16, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
                {str.transferSearchUnavailable}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
