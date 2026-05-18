import { View, Text, Alert, Linking, TouchableOpacity, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import * as str from "@/lib/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef, ReactElement, Fragment } from "react";
import { EmergencyCase, EmergencyStatus, MedicalInfo } from "@/lib/models";
import { useApi } from "@/lib/api/useApi";
import { useMedicalInfo } from "@/lib/hooks/useMedicalInfo";
import { useEmergencyStatus } from "@/lib/hooks/useEmergencyStatus";
import { getCurrentLocation } from "@/lib/utils/location";
import EmergencyBtn from "@/lib/components/EmergencyBtn";
import SIEELogo from "@/lib/components/SieeLogo";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import {
  AppBar,
  ClinicalCard,
  Chip,
  PillButton,
  PersonSelectorCard,
  RejectReasonSheet,
} from "@/lib/components/cl";

const DEFAULT_TIMEOUT_DELAY_SECONDS: number = 2;

/** SecureStore key for persisting the active emergency ID across app restarts. */
const ACTIVE_EMERGENCY_KEY = "activeEmergencyId";


export default function Main(): ReactElement {
  const [emergencyCase, setEmergencyCase] = useState<EmergencyCase | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const { emergencyUpdateListener } = useApi();
  const { medicalInfoList, selectedPersonIndex, setSelectedPersonIndex } = useMedicalInfo();
  const { onStatusChange } = useEmergencyStatus();
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  /* ── Restore active emergency on mount ───────────────────────────────
   * If the app was killed while an emergency was in progress, the ID
   * persisted in SecureStore lets us reconnect via SUBSCRIBE and pick
   * up right where we left off.                                  */
  useEffect(() => {
    (async () => {
      const savedId = await SecureStore.getItemAsync(ACTIVE_EMERGENCY_KEY);
      if (!savedId) {
        setIsRestoring(false);
        return;
      }

      try {
        const emergencyResult = await emergencyUpdateListener.subscribeToEmergency(
          savedId,
          (emergency) => {
            if (
              emergency.emergencyState === EmergencyStatus.CLOSED ||
              emergency.emergencyState === EmergencyStatus.CANCELLED
            ) {
              setEmergencyCase(null);
              SecureStore.deleteItemAsync(ACTIVE_EMERGENCY_KEY);
            } else {
              setEmergencyCase(emergency);
            }
            onStatusChangeRef.current(EmergencyStatus[emergency.emergencyState]);
          },
        );

        if (
          emergencyResult.emergencyState === EmergencyStatus.CLOSED ||
          emergencyResult.emergencyState === EmergencyStatus.CANCELLED
        ) {
          setEmergencyCase(null);
          await SecureStore.deleteItemAsync(ACTIVE_EMERGENCY_KEY);
        } else {
          setEmergencyCase(emergencyResult);
        }
      } catch {
        // Subscription failed (e.g. emergency no longer exists) — clear stale ID.
        await SecureStore.deleteItemAsync(ACTIVE_EMERGENCY_KEY);
      } finally {
        setIsRestoring(false);
      }
    })();
  }, [emergencyUpdateListener]);

  const getSelectedMedicalInfo = (): MedicalInfo | null => {
    if (selectedPersonIndex !== null && medicalInfoList.length > 0) {
      return medicalInfoList[selectedPersonIndex];
    }
    return null;
  };

  const sendAlert = async () => {
    const medicalInfo = getSelectedMedicalInfo();
    const location = await getCurrentLocation();

    if (location === null) {
      Alert.alert(str.alertWarning, str.alertLocationNotAvailable, [
        { text: str.btnOK, style: "default" },
      ]);
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${str.aboutUsPhoneNumber}`);

    const reported = await emergencyUpdateListener.reportEmergency(
      { reportedOn: new Date(), medicalInfo, location },
      (emergency) => {
        if (
          emergency.emergencyState === EmergencyStatus.CLOSED ||
          emergency.emergencyState === EmergencyStatus.CANCELLED
        ) {
          setEmergencyCase(null);
          SecureStore.deleteItemAsync(ACTIVE_EMERGENCY_KEY);
        } else {
          setEmergencyCase(emergency);
        }
        onStatusChangeRef.current(EmergencyStatus[emergency.emergencyState]);
      },
    );

    setEmergencyCase(reported);
    if (reported.id) {
      await SecureStore.setItemAsync(ACTIVE_EMERGENCY_KEY, reported.id);
    }
  };

  const handleCancelEmergency = () => {
    setCancelSheetOpen(true);
  };

  const handleConfirmCancel = ({ reason, notes }: { reason: string; notes: string }) => {
    const fullReason = notes ? `${reason} — ${notes}` : reason;
    if (emergencyCase?.id) emergencyUpdateListener.cancelEmergency(emergencyCase.id, fullReason);
    setCancelSheetOpen(false);
  };

  if (isRestoring) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: mobileColors.bg, alignItems: "center", justifyContent: "center", gap: 24 }}
      >
        <SIEELogo size={64} />
        <ActivityIndicator size="large" color={mobileColors.primary} />
      </SafeAreaView>
    );
  }

  if (emergencyCase !== null) {
    return (
      <Fragment>
        <ActiveView emergencyCase={emergencyCase} onCancel={handleCancelEmergency} />
        <RejectReasonSheet
          visible={cancelSheetOpen}
          onClose={() => setCancelSheetOpen(false)}
          onConfirm={handleConfirmCancel}
          title={str.cancelEmergencySheetTitle}
          confirmLabel={str.cancelEmergencyConfirmLabel}
          reasons={str.cancelEmergencyReasons}
        />
      </Fragment>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar
        title="SIEE"
        subtitle="Sistema de Emergencias Envigado"
        trailing={<SIEELogo size={36} />}
      />
      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        {/* Person selector */}
        <PersonSelectorCard
          medicalInfoList={medicalInfoList}
          selectedPersonIndex={selectedPersonIndex}
          onSelect={setSelectedPersonIndex}
          showThirdPartyOption
        />

        {/* SOS center */}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 22 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: mobileColors.critical,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontFamily: "Inter_700Bold",
            }}
          >
            {str.emergency}
          </Text>

          <EmergencyBtn
            timeoutDelaySeconds={DEFAULT_TIMEOUT_DELAY_SECONDS}
            afterPress={sendAlert}
            disabled={false}
            ringColor={mobileColors.critical}
          >
            <View
              style={{
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: "#D62828",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: mobileColors.critical,
                shadowOffset: { width: 0, height: 24 },
                shadowOpacity: 0.55,
                shadowRadius: 40,
                elevation: 12,
              }}
            >
              <Feather name="alert-circle" size={42} color="#fff" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "800",
                  letterSpacing: 2,
                  marginTop: 8,
                  fontFamily: "Inter_800ExtraBold",
                }}
              >
                SOS
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 11,
                  fontWeight: "600",
                  marginTop: 2,
                  letterSpacing: 0.5,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                MANTÉN PULSADO
              </Text>
            </View>
          </EmergencyBtn>

          <Text
            style={{
              textAlign: "center",
              color: mobileColors.textMid,
              fontSize: 13,
              paddingHorizontal: 32,
              lineHeight: 20,
              fontFamily: "Inter_400Regular",
            }}
          >
            Tu ubicación y datos médicos se enviarán automáticamente al equipo paramédico.
          </Text>
        </View>

        {/* Phone card */}
        <ClinicalCard style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              backgroundColor: mobileColors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="phone" size={17} color={mobileColors.primaryDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }}>
              Línea directa Envigado
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: mobileColors.text, fontFamily: "Inter_700Bold" }}>
              {str.aboutUsPhoneNumber}
            </Text>
          </View>
          <Chip label="24/7" tone="mild" />
        </ClinicalCard>
      </View>
    </SafeAreaView>
  );
}

export function ActiveView({ emergencyCase, onCancel }: { emergencyCase: EmergencyCase; onCancel: () => void }) {
  const stateKey = EmergencyStatus[emergencyCase.emergencyState];
  const statusLabel = str.emergencyStatusMessages[stateKey] ?? "En curso";
  const card = str.emergencyStatusCard[stateKey] ?? str.emergencyStatusCard.RECEIVED;

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar title="SIEE" subtitle={statusLabel} accent="EN CURSO" />
      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        {/* Hero gradient */}
        <View
          style={{
            borderRadius: mobileRadii.lg,
            padding: 20,
            backgroundColor: mobileColors.primaryDeep,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: mobileColors.primary,
              opacity: 0.5,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: mobileColors.mild,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.85)",
                fontFamily: "Inter_700Bold",
              }}
            >
              {card.eyebrow}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: -0.4,
              marginBottom: 4,
              fontFamily: "Inter_800ExtraBold",
            }}
          >
            {card.title}
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: "rgba(255,255,255,0.15)",
              marginVertical: 16,
            }}
          />
          <Text
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              fontFamily: "Inter_400Regular",
            }}
          >
            {card.description}
          </Text>

          {typeof emergencyCase.filingNumber === "number" && (
            <>
              <View
                style={{ height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginTop: 16 }}
              />
              <TouchableOpacity
                testID="filing-number-row"
                onPress={async () => {
                  await Clipboard.setStringAsync(str.formatFilingNumber(emergencyCase.filingNumber));
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Toast.show({ type: "success", text1: str.citizenFilingNumberCopied });
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="hash" size={13} color="rgba(255,255,255,0.7)" />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    {str.citizenFilingNumberLabel}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#fff",
                      fontFamily: "Inter_800ExtraBold",
                      letterSpacing: -0.3,
                    }}
                  >
                    {str.formatFilingNumber(emergencyCase.filingNumber)}
                  </Text>
                  <Feather name="copy" size={13} color="rgba(255,255,255,0.6)" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${str.aboutUsPhoneNumber}`)}>
          <PillButton label="Llamar al paramédico" icon="phone" full size="lg" />
        </TouchableOpacity>
        {/* Citizens may only cancel while the paramedic has not yet arrived. */}
        {(emergencyCase.emergencyState === EmergencyStatus.RECEIVED ||
          emergencyCase.emergencyState === EmergencyStatus.DISPATCHED) && (
          <PillButton
            label={str.cancelEmergencyBtn}
            variant="outline"
            icon="x"
            full
            size="lg"
            onPress={onCancel}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
