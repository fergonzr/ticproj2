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
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRouter } from "expo-router";
import { useApi } from "@/lib/api/useApi";
import { useParamedicUser } from "@/lib/hooks/useParamedicUser";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { EmergencyAssignment, RouteInfo, EmergencyCase, GeoLocation, RoutePoint } from "@/lib/models";
import { BLOOD_TYPES } from "@/lib/models";
import OsmMap, { OsmMapHandle } from "@/lib/map/OsmMap";
import * as str from "@/lib/strings";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import AppButton from "@/lib/components/AppButton";
import {
  AssignmentAcceptError,
  AssignmentRejectError,
  RouteFetchError,
} from "@/lib/api/errors";
import { mobileColors } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, Chip, SectionLabel, PillButton } from "@/lib/components/cl";

type ScreenState = "idle" | "pending" | "active" | "route" | "info";

function formatAllergies(a?: string[]): string {
  return a && a.length > 0 ? a.join(", ") : str.optionNoneF;
}

export default function EmergencyBrowser(): ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const { paramedicUser } = useParamedicUser();
  const { paramedicLocationTracker: locationTracker, emergencyAssignmentListener, routeProvider } = useApi();
  const { activeEmergency, setActiveEmergency } = useActiveEmergency();
  const mapRef = useRef<OsmMapHandle>(null);

  const [screenState, setScreenState] = useState<ScreenState>("idle");
  const [pendingAssignment, setPendingAssignment] = useState<EmergencyAssignment | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapMarker, setMapMarker] = useState<GeoLocation | null>(null);
  const [mapPolyline, setMapPolyline] = useState<RoutePoint[] | null>(null);

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

  const handleReject = useCallback(async () => {
    if (!pendingAssignment) return;
    try {
      await emergencyAssignmentListener.rejectAssignment(pendingAssignment.id);
    } catch (error) {
      Alert.alert(str.alertError, error instanceof AssignmentRejectError ? str.alertAssignmentRejectError : str.alertError);
    }
    setPendingAssignment(null);
    setScreenState("idle");
    clearMap();
  }, [pendingAssignment, emergencyAssignmentListener, clearMap]);

  const handleRoute = useCallback(async () => {
    if (!activeEmergency) return;
    setIsLoading(true);
    try {
      const route = await routeProvider.getRoute(
        { latitude: 6.168, longitude: -75.592 },
        activeEmergency.location,
      );
      setRouteInfo(route);
      setScreenState("route");
      setMapPolyline(route.points);
      if (route.points.length > 0) {
        mapRef.current?.fitToCoordinates(route.points);
      }
    } catch (error) {
      Alert.alert(str.alertError, error instanceof RouteFetchError ? str.alertRouteFetchError : str.alertError);
    } finally {
      setIsLoading(false);
    }
  }, [activeEmergency, routeProvider]);

  const handleCall = useCallback(() => {
    if (!activeEmergency?.medicalInfo.phone) return;
    Linking.openURL(`tel:${activeEmergency.medicalInfo.phone}`);
  }, [activeEmergency]);

  const handleInfo = useCallback(() => { setScreenState("info"); }, []);

  const handleReportArrival = useCallback(async () => {
    if (!activeEmergency) return;
    try { await emergencyAssignmentListener.reportArrival(); }
    catch (e) { console.warn("Failed to report arrival to backend", e); }
    setRouteInfo(null);
    router.push("/(paramedic)/ComplexityAssignment");
  }, [activeEmergency, router, emergencyAssignmentListener]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
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
        {screenState === "idle"    && renderIdlePanel()}
        {screenState === "pending" && renderPendingPanel()}
        {screenState === "active"  && activeEmergency && renderActivePanel(activeEmergency)}
        {screenState === "route"   && renderRoutePanel()}
        {screenState === "info"    && activeEmergency && renderInfoPanel(activeEmergency)}
      </View>
    </SafeAreaView>
  );

  // ─── Panel renderers ────────────────────────────────────────────────────────

  function renderIdlePanel(): ReactElement {
    return (
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
        <ClinicalCard style={{ padding: 22, alignItems: "center" }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              backgroundColor: mobileColors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Feather name="bell" size={22} color={mobileColors.primaryDeep} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
            {str.emergencyListTitle}
          </Text>
          <Text style={{ fontSize: 13, color: mobileColors.textMid, marginTop: 4, textAlign: "center", lineHeight: 20, fontFamily: "Inter_400Regular" }}>
            {str.noActiveEmergency}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 20,
              justifyContent: "center",
              marginTop: 16,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: mobileColors.borderSoft,
              width: "100%",
            }}
          >
            {[
              [paramedicUser?.id ?? "—", "ID"],
              ["24/7", "Disponible"],
            ].map(([val, lbl]) => (
              <View key={lbl} style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>{val}</Text>
                <Text style={{ fontSize: 11, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>{lbl}</Text>
              </View>
            ))}
          </View>
        </ClinicalCard>
      </View>
    );
  }

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

            {/* Accept / Reject */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={handleReject}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: mobileColors.criticalBg,
                  borderWidth: 1.5,
                  borderColor: mobileColors.critical,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Feather name="x" size={18} color={mobileColors.critical} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: mobileColors.critical, fontFamily: "Inter_700Bold" }}>
                  Rechazar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAccept}
                disabled={isLoading}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 999,
                  backgroundColor: mobileColors.mild,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: isLoading ? 0.6 : 1,
                  shadowColor: mobileColors.mild,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Feather name="check" size={18} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>
                  {str.acceptRequest}
                </Text>
              </TouchableOpacity>
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

          {/* Action buttons */}
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleRoute}
              disabled={isLoading}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 999,
                backgroundColor: mobileColors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Feather name="navigation" size={15} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>{str.routeTo}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleInfo}
              style={{
                flex: 1,
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
              <Text style={{ fontSize: 13, fontWeight: "700", color: mobileColors.primary, fontFamily: "Inter_700Bold" }}>{str.patientInfo}</Text>
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
              <Feather name="map-pin" size={22} color={mobileColors.mild} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                Has llegado al lugar
              </Text>
              <Text style={{ fontSize: 12, color: mobileColors.textMid, fontFamily: "Inter_400Regular" }}>
                Confirma tu llegada para comenzar la atención.
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setScreenState("active")}
              style={{
                flex: 1,
                height: 52,
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
              <Text style={{ fontSize: 14, fontWeight: "700", color: mobileColors.primary, fontFamily: "Inter_700Bold" }}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReportArrival}
              style={{
                flex: 1.4,
                height: 52,
                borderRadius: 999,
                backgroundColor: mobileColors.mild,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
                shadowColor: mobileColors.mild,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" }}>Confirmar llegada</Text>
            </TouchableOpacity>
          </View>
        </ClinicalCard>
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

          <View style={{ flexDirection: "row", gap: 10 }}>
            <PillButton label={str.goBack} variant="outline" size="lg" style={{ flex: 1 }} onPress={() => setScreenState("active")} />
            <PillButton label={str.triage} icon="arrow-right" size="lg" style={{ flex: 1.4 }} onPress={handleReportArrival} />
          </View>
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
