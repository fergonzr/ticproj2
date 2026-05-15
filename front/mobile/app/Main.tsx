import { View, Text, Alert, Linking, TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import * as str from "@/lib/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, ReactElement } from "react";
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
} from "@/lib/components/cl";

const DEFAULT_TIMEOUT_DELAY_SECONDS: number = 2;


export default function Main(): ReactElement {
  const [emergencyCase, setEmergencyCase] = useState<EmergencyCase | null>(null);
  const { emergencyUpdateListener } = useApi();
  const { medicalInfoList, selectedPersonIndex, setSelectedPersonIndex } = useMedicalInfo();
  const { onStatusChange } = useEmergencyStatus();

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

    setEmergencyCase(
      await emergencyUpdateListener.reportEmergency(
        { reportedOn: new Date(), medicalInfo, location },
        (emergency) => {
          if (
            emergency.emergencyState === EmergencyStatus.CLOSED ||
            emergency.emergencyState === EmergencyStatus.CANCELLED
          ) {
            setEmergencyCase(null);
          } else {
            setEmergencyCase(emergency);
          }
          onStatusChange(EmergencyStatus[emergency.emergencyState]);
        },
      ),
    );
  };

  const handleCancelEmergency = () => {
    Alert.alert(str.cancelEmergencyConfirmTitle, str.cancelEmergencyConfirmBody, [
      { text: str.btnCancel, style: "cancel" },
      {
        text: str.btnOK,
        style: "destructive",
        onPress: () => {
          if (emergencyCase?.id) emergencyUpdateListener.cancelEmergency(emergencyCase.id, "");
          setEmergencyCase(null);
        },
      },
    ]);
  };

  if (emergencyCase !== null) {
    return <ActiveView emergencyCase={emergencyCase} onCancel={handleCancelEmergency} />;
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

function ActiveView({ emergencyCase, onCancel }: { emergencyCase: EmergencyCase; onCancel: () => void }) {
  const statusLabel =
    str.emergencyStatusMessages[EmergencyStatus[emergencyCase.emergencyState]] ?? "En curso";

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
              La ayuda viene en camino
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
            Equipo paramédico asignado
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
            {statusLabel}
          </Text>
        </View>

        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${str.aboutUsPhoneNumber}`)}>
          <PillButton label="Llamar al paramédico" icon="phone" full size="lg" />
        </TouchableOpacity>
        <PillButton
          label={str.cancelEmergencyBtn}
          variant="outline"
          icon="x"
          full
          size="lg"
          onPress={onCancel}
        />
      </View>
    </SafeAreaView>
  );
}
