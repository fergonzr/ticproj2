import { ReactElement, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApi } from "@/lib/api/useApi";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { ComplexityLevel } from "@/lib/models";
import * as str from "@/lib/strings";
import { mobileColors } from "@/lib/themes/mobileTokens";
import { AppBar, PillButton } from "@/lib/components/cl";

type LevelDef = {
  level: ComplexityLevel;
  title: string;
  desc: string;
  time: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bg: string;
};

const LEVELS: LevelDef[] = [
  {
    level: ComplexityLevel.HIGH,
    title: str.complexityHigh,
    desc: str.complexityHighDesc,
    time: "0–5 min",
    icon: "zap",
    color: mobileColors.critical,
    bg: mobileColors.criticalBg,
  },
  {
    level: ComplexityLevel.INTERMEDIATE,
    title: str.complexityIntermediate,
    desc: str.complexityIntermediateDesc,
    time: "15–30 min",
    icon: "alert-triangle",
    color: mobileColors.urgent,
    bg: mobileColors.urgentBg,
  },
  {
    level: ComplexityLevel.BASIC,
    title: str.complexityBasic,
    desc: str.complexityBasicDesc,
    time: "1–2 h",
    icon: "check",
    color: mobileColors.mild,
    bg: mobileColors.mildBg,
  },
];

export default function ComplexityAssignment(): ReactElement {
  const router = useRouter();
  const { emergencyAssignmentListener } = useApi();
  const { activeEmergency, setActiveEmergency } = useActiveEmergency();
  const { bottom } = useSafeAreaInsets();
  const [selected, setSelected] = useState<ComplexityLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patient =
    activeEmergency
      ? `${activeEmergency.medicalInfo.firstName} ${activeEmergency.medicalInfo.lastName}`.trim()
      : "";
  const filingLabel = activeEmergency
    ? str.formatFilingNumber(activeEmergency.filingNumber)
    : null;
  const subtitle = filingLabel
    ? `${filingLabel}${patient ? ` · ${patient}` : ""}`
    : undefined;

  const handleConfirm = async () => {
    if (selected === null) return;
    setSubmitting(true);
    try {
      await emergencyAssignmentListener.assignComplexity(selected);
      // Reflect the retriage locally so later screens (report) show it.
      if (activeEmergency) {
        setActiveEmergency({ ...activeEmergency, complexityLevel: selected });
      }
      // After the level is assigned the paramedic decides how to proceed:
      // - Resolve on site: the patient doesn't need transfer, so we mark the
      //   emergency as resolved and return to idle. No prehospital care report
      //   is needed (that report is only for the transfer flow).
      // - Transfer to hospital: navigate to the medical center selection
      //   screen, where the prehospital care report is reachable later.
      Alert.alert(
        "¿Cómo continuamos?",
        "Selecciona si el paciente fue atendido en sitio o requiere traslado a un centro médico.",
        [
          {
            text: str.resolveOnSiteBtn,
            onPress: async () => {
              try {
                await emergencyAssignmentListener.markResolved();
              } catch (e) {
                console.warn("Failed to mark emergency as resolved on site", e);
              }
              setActiveEmergency(null);
              router.replace("/(paramedic)/EmergencyBrowser");
            },
          },
          {
            text: "Trasladar a hospital",
            style: "default",
            onPress: () => router.replace("/(paramedic)/MedicalCenterTransfer"),
          },
        ],
        { cancelable: false },
      );
    } catch (e) {
      Alert.alert(str.alertError, String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg }}>
      <AppBar
        title="Triaje rápido"
        subtitle={subtitle}
        leading={
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
            <Feather name="chevron-left" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1, padding: 20, paddingBottom: bottom + 12, gap: 14 }}>
        <View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: mobileColors.text,
              letterSpacing: -0.5,
              lineHeight: 26,
              fontFamily: "Inter_900Black",
            }}
          >
            {str.complexityScreenTitle}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: mobileColors.textMid,
              marginTop: 6,
              lineHeight: 20,
              fontFamily: "Inter_400Regular",
            }}
          >
            Selecciona el nivel que mejor describe el estado del paciente.
          </Text>
        </View>

        <View style={{ flex: 1, gap: 12 }}>
          {LEVELS.map((lv) => {
            const isActive = selected === lv.level;
            return (
              <TouchableOpacity
                key={lv.level}
                activeOpacity={0.85}
                onPress={() => setSelected(lv.level)}
                style={{
                  flex: 1,
                  borderRadius: 22,
                  paddingHorizontal: 18,
                  paddingVertical: 20,
                  borderWidth: isActive ? 2 : 1.5,
                  borderColor: isActive ? lv.color : mobileColors.border,
                  backgroundColor: isActive ? lv.color : "#fff",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  shadowColor: isActive ? lv.color : "#0B1620",
                  shadowOffset: { width: 0, height: isActive ? 12 : 1 },
                  shadowOpacity: isActive ? 0.28 : 0.04,
                  shadowRadius: isActive ? 22 : 3,
                  elevation: isActive ? 8 : 1,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    backgroundColor: isActive ? "rgba(255,255,255,0.18)" : lv.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={lv.icon} size={26} color={isActive ? "#fff" : lv.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "900",
                      letterSpacing: -0.4,
                      color: isActive ? "#fff" : mobileColors.text,
                      fontFamily: "Inter_900Black",
                    }}
                  >
                    {lv.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      marginTop: 2,
                      color: isActive ? "rgba(255,255,255,0.9)" : mobileColors.textMid,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {lv.desc}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <Feather
                      name="clock"
                      size={11}
                      color={isActive ? "rgba(255,255,255,0.8)" : lv.color}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        color: isActive ? "rgba(255,255,255,0.85)" : lv.color,
                        fontFamily: "Inter_700Bold",
                      }}
                    >
                      {lv.time}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: isActive ? "#fff" : mobileColors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isActive && <Feather name="check" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <PillButton
          label="Continuar"
          icon="arrow-right"
          full
          size="lg"
          loading={submitting}
          disabled={selected === null || submitting}
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
}
