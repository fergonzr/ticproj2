import { ReactElement, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { PatientFinalState } from "@/lib/models";
import * as str from "@/lib/strings";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, Chip, SectionLabel, PillButton } from "@/lib/components/cl";

interface FinalStateOption {
  state: PatientFinalState;
  label: string;
  tone: "critical" | "urgent" | "mild" | "primary";
}

const FINAL_STATES: FinalStateOption[] = [
  { state: PatientFinalState.CRITICAL,      label: str.patientStatusCritical,      tone: "critical" },
  { state: PatientFinalState.DETERIORATING, label: str.patientStatusDeteriorating, tone: "urgent"   },
  { state: PatientFinalState.STABLE,        label: str.patientStatusStable,        tone: "mild"     },
  { state: PatientFinalState.IMPROVING,     label: str.patientStatusImproving,     tone: "primary"  },
];

interface Form {
  initialStateDescription: string;
  treatmentDescription: string;
  finalState: PatientFinalState | null;
  finalStateDescription: string;
}

const EMPTY_FORM: Form = {
  initialStateDescription: "",
  treatmentDescription: "",
  finalState: null,
  finalStateDescription: "",
};

function validateForm(form: Form): string | null {
  if (form.initialStateDescription.trim().length === 0) return str.validationCareInitialRequired;
  if (form.treatmentDescription.trim().length === 0) return str.validationCareTreatmentRequired;
  if (form.finalState === null) return str.careReportFinalState;
  if (form.finalStateDescription.trim().length === 0) return str.validationCareFinalDescRequired;
  return null;
}

export default function PrehospitalCareReport(): ReactElement {
  const router = useRouter();
  const { emergencyAssignmentListener } = useApi();
  const { activeEmergency, setActiveEmergency } = useActiveEmergency();
  const { bottom } = useSafeAreaInsets();
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const patient = activeEmergency
    ? `${activeEmergency.medicalInfo.firstName} ${activeEmergency.medicalInfo.lastName}`.trim()
    : "";
  const shortId = activeEmergency?.id?.split("-").pop() ?? null;
  const subtitle = shortId ? `ALT-${shortId}${patient ? ` · ${patient}` : ""}` : undefined;

  const setField = <K extends keyof Form>(field: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const err = validateForm(form);
    if (err) {
      Alert.alert(str.alertError, err);
      return;
    }
    setSubmitting(true);
    try {
      await emergencyAssignmentListener.reportPrehospitalCare({
        initialStateDescription: form.initialStateDescription.trim(),
        treatmentDescription: form.treatmentDescription.trim(),
        finalState: form.finalState!,
        finalStateDescription: form.finalStateDescription.trim(),
      });
      await emergencyAssignmentListener.markResolved();
      setActiveEmergency(null);
      router.replace("/(paramedic)/EmergencyBrowser");
    } catch (e) {
      Alert.alert(str.alertError, str.careReportError);
      console.warn("Prehospital care submission failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: mobileColors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppBar
        title="Reporte de caso"
        subtitle={subtitle}
        leading={
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
            <Feather name="chevron-left" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: bottom + 24, gap: 14 }}
      >
        {/* Patient summary card */}
        {activeEmergency && (
          <ClinicalCard style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 42, height: 42, borderRadius: 13,
                  backgroundColor: mobileColors.primarySoft,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: mobileColors.primaryDeep, fontFamily: "Inter_800ExtraBold" }}>
                  {(activeEmergency.medicalInfo.firstName.charAt(0) + activeEmergency.medicalInfo.lastName.charAt(0)).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: mobileColors.text, fontFamily: "Inter_800ExtraBold" }}>
                  {patient || "Paciente"}
                  {activeEmergency.medicalInfo.age ? ` · ${activeEmergency.medicalInfo.age}` : ""}
                </Text>
                <Text style={{ fontSize: 11, color: mobileColors.textSoft, fontFamily: "Inter_400Regular" }} numberOfLines={1}>
                  {activeEmergency.medicalInfo.documentNumber
                    ? `Doc ${activeEmergency.medicalInfo.documentNumber}`
                    : "Sin documento"}
                  {activeEmergency.medicalInfo.bloodType ? ` · ${activeEmergency.medicalInfo.bloodType}` : ""}
                </Text>
              </View>
            </View>
          </ClinicalCard>
        )}

        {/* Initial state */}
        <View>
          <SectionLabel>{str.careReportInitialState}</SectionLabel>
          <TextInput
            value={form.initialStateDescription}
            onChangeText={(v) => setField("initialStateDescription", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.careReportInitialStatePlaceholder}
            placeholderTextColor={mobileColors.textSoft}
            style={{
              minHeight: 72,
              padding: 12,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: mobileColors.border,
              borderRadius: mobileRadii.md,
              fontSize: 13,
              color: mobileColors.text,
              fontFamily: "Inter_400Regular",
              lineHeight: 20,
            }}
          />
        </View>

        {/* Treatment */}
        <View>
          <SectionLabel>{str.careReportTreatment}</SectionLabel>
          <TextInput
            value={form.treatmentDescription}
            onChangeText={(v) => setField("treatmentDescription", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.careReportTreatmentPlaceholder}
            placeholderTextColor={mobileColors.textSoft}
            style={{
              minHeight: 72,
              padding: 12,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: mobileColors.border,
              borderRadius: mobileRadii.md,
              fontSize: 13,
              color: mobileColors.text,
              fontFamily: "Inter_400Regular",
              lineHeight: 20,
            }}
          />
        </View>

        {/* Final state */}
        <View>
          <SectionLabel>{str.careReportFinalState}</SectionLabel>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {FINAL_STATES.map((opt) => {
              const active = form.finalState === opt.state;
              const toneColor = ({
                critical: mobileColors.critical,
                urgent: mobileColors.urgent,
                mild: mobileColors.mild,
                primary: mobileColors.primary,
              } as const)[opt.tone];
              const toneBg = ({
                critical: mobileColors.criticalBg,
                urgent: mobileColors.urgentBg,
                mild: mobileColors.mildBg,
                primary: mobileColors.primaryTint,
              } as const)[opt.tone];
              return (
                <TouchableOpacity
                  key={opt.state}
                  onPress={() => setField("finalState", opt.state)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: active ? toneColor : mobileColors.border,
                    backgroundColor: active ? toneBg : "#fff",
                  }}
                >
                  <View
                    style={{
                      width: 18, height: 18, borderRadius: 999,
                      borderWidth: 2,
                      borderColor: active ? toneColor : mobileColors.border,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {active && (
                      <Feather name="check" size={11} color={toneColor} />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: active ? toneColor : mobileColors.textMid,
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Final state description */}
        <View>
          <SectionLabel>{str.careReportFinalStateDesc}</SectionLabel>
          <TextInput
            value={form.finalStateDescription}
            onChangeText={(v) => setField("finalStateDescription", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.careReportFinalStateDescPlaceholder}
            placeholderTextColor={mobileColors.textSoft}
            style={{
              minHeight: 64,
              padding: 12,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: mobileColors.border,
              borderRadius: mobileRadii.md,
              fontSize: 13,
              color: mobileColors.text,
              fontFamily: "Inter_400Regular",
              lineHeight: 20,
            }}
          />
        </View>

        {/* Signature card (visual only) */}
        <ClinicalCard
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: mobileColors.primaryTint,
            borderColor: mobileColors.primarySoft,
          }}
        >
          <Feather name="edit-3" size={16} color={mobileColors.primaryDeep} />
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: "700",
              color: mobileColors.primaryDeep,
              fontFamily: "Inter_700Bold",
            }}
            numberOfLines={1}
          >
            Firma digital del paramédico
          </Text>
          <Chip label="Firmado" tone="mild" icon="check" />
        </ClinicalCard>

        <PillButton
          label={str.careReportSubmit}
          icon="send"
          full
          size="lg"
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
