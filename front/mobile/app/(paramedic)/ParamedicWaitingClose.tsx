import { ReactElement, useEffect } from "react";
import { BackHandler, View, Text } from "react-native";
import { useRouter } from "expo-router";
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
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AppBar, ClinicalCard, Chip } from "@/lib/components/cl";

export default function ParamedicWaitingClose(): ReactElement {
  const router = useRouter();
  const { activeEmergency } = useActiveEmergency();
  const { paramedicLocationTracker } = useApi();

  // Disable back navigation — the paramedic must wait here until the
  // operator closes the emergency. Going back to a solved case makes
  // no sense and would confuse the state machine.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  const locationTracking = useParamedicLocationTracking({
    locationTracker: paramedicLocationTracker,
    updateIntervalMs: 5000,
    distanceInterval: 0,
  });

  // When the operator closes the emergency, _onEmergencyUpdate in the
  // layout will clear activeEmergency (set it to null for CLOSED status).
  // The EmergencyBrowser effect will then transition to idle.
  useEffect(() => {
    if (activeEmergency === null) {
      router.replace("/(paramedic)/EmergencyBrowser");
    }
  }, [activeEmergency, router]);

  // Pulsing dot animation to indicate "waiting"
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.4, { duration: 1200 }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const patientName = activeEmergency
    ? `${activeEmergency.medicalInfo.firstName} ${activeEmergency.medicalInfo.lastName}`.trim()
    : "";
  const filingLabel = activeEmergency
    ? str.formatFilingNumber(activeEmergency.filingNumber)
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar title="Caso resuelto" subtitle={filingLabel || undefined} />

      {/* Map */}
      <View style={{ flex: 1, position: "relative" }}>
        <OsmMap
          paramedicMarker={locationTracking.lastLocation}
          marker={null}
          polyline={null}
        />

        {/* Waiting overlay card */}
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
          }}
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
            {/* Green header — case resolved */}
            <View
              style={{
                backgroundColor: mobileColors.mild,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="check-circle" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#fff",
                    fontFamily: "Inter_800ExtraBold",
                  }}
                >
                  Caso resuelto
                </Text>
                {patientName ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: "Inter_400Regular",
                    }}
                    numberOfLines={1}
                  >
                    {patientName}
                  </Text>
                ) : null}
              </View>
              <Animated.View style={[pulseStyle]}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: "#fff",
                  }}
                />
              </Animated.View>
            </View>

            {/* Body — waiting message */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Feather name="clock" size={16} color={mobileColors.textMid} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: "700",
                    color: mobileColors.text,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Esperando cierre del operador
                </Text>
                <Chip label="EN ESPERA" tone="primary" size="sm" icon="clock" />
              </View>

              <Text
                style={{
                  fontSize: 12,
                  color: mobileColors.textMid,
                  lineHeight: 18,
                  fontFamily: "Inter_400Regular",
                }}
              >
                Tu reporte fue recibido. El operador revisará el caso y lo cerrará
                momentáneamente. No es necesario que realices ninguna acción adicional.
              </Text>
            </View>
          </ClinicalCard>
        </View>
      </View>
    </View>
  );
}