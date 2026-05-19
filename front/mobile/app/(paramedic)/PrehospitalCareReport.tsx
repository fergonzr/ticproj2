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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useApi } from "@/lib/api/useApi";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { PatientFinalState, BLOOD_TYPES } from "@/lib/models";
import { getEmergencyCriticality } from "@/lib/utils/triagePriority";
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
  const { activeEmergency } = useActiveEmergency();
  const { bottom } = useSafeAreaInsets();
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // "transfer" mode = prehospital care report for a hospital transfer (default).
  // "onsite" mode = on-site resolution report: send the report AND mark resolved.
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isOnsite = mode === "onsite";

  const patient = activeEmergency
    ? `${activeEmergency.medicalInfo.firstName} ${activeEmergency.medicalInfo.lastName}`.trim()
    : "";
  const filingLabel = activeEmergency
    ? str.formatFilingNumber(activeEmergency.filingNumber)
    : null;
  const subtitle = filingLabel
    ? `${filingLabel}${patient ? ` · ${patient}` : ""}`
    : undefined;
  const criticality = activeEmergency ? getEmergencyCriticality(activeEmergency) : null;

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
      // The coordination WS will push an updated EmergencyCase with
      // prehospitalCareReportSent = true, which _onEmergencyUpdate →
      // setActiveEmergency picks up automatically — no manual local patch needed.

      if (isOnsite) {
        // On-site resolution: after sending the care report, mark the emergency
        // as resolved and navigate to the waiting screen.
        try {
          await emergencyAssignmentListener.markResolved();
        } catch (e) {
          console.warn("Failed to mark emergency as resolved on site", e);
        }
        router.replace("/(paramedic)/ParamedicWaitingClose");
      } else {
        // Transfer flow: return to the navigation screen to continue routing
        // to the hospital.
        router.replace("/(paramedic)/ParamedicNavigating");
      }
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AppBar
        title={isOnsite ? str.onsiteCareReportTitle : str.careReportTitle}
        subtitle={isOnsite ? str.onsiteCareReportSubtitle : subtitle ?? undefined}
        leading={
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
            <Feather name="chevron-left" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: bottom + 96, gap: 14 }}
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
                  {` · ${BLOOD_TYPES[activeEmergency.medicalInfo.bloodType] ?? str.bloodTypeUnassigned}`}
                </Text>
              </View>
            </View>
          </ClinicalCard>
        )}

        {/* Criticality — read-only. Set by the operator's triage and updated
            by the paramedic's complexity assignment (the retriage). */}
        {criticality && (
          <View>
            <SectionLabel>Nivel de criticidad</SectionLabel>
            <ClinicalCard style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="activity" size={16} color={mobileColors.primary} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: mobileColors.textMid,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {criticality.source === "paramedic"
                  ? str.criticalitySourceParamedic
                  : criticality.source === "operator"
                    ? str.criticalitySourceOperator
                    : str.criticalityUnknown}
              </Text>
              <Chip label={criticality.label} tone={criticality.tone} />
            </ClinicalCard>
          </View>
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

        {/* Final state — 2x2 grid */}
        <View>
          <SectionLabel>{str.careReportFinalState}</SectionLabel>
          <View style={{ gap: 8 }}>
            {[0, 2].map((rowStart) => (
              <View key={rowStart} style={{ flexDirection: "row", gap: 8 }}>
                {FINAL_STATES.slice(rowStart, rowStart + 2).map((opt) => {
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
                        flex: 1,
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
                        numberOfLines={1}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
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
      </ScrollView>

      {/* Sticky send bar so the action is always visible above the keyboard/inset */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: mobileColors.borderSoft,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: bottom + 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <PillButton
          label={isOnsite ? str.onsiteCareReportSubmit : str.careReportSubmit}
          icon="send"
          full
          size="lg"
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
