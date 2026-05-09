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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AppButton from "@/lib/components/AppButton";
import { useApi } from "@/lib/api/useApi";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { PatientFinalState } from "@/lib/models";
import * as str from "@/lib/strings";

interface FinalStateOption {
  state: PatientFinalState;
  label: string;
}

const FINAL_STATES: FinalStateOption[] = [
  { state: PatientFinalState.CRITICAL, label: str.patientStatusCritical },
  { state: PatientFinalState.DETERIORATING, label: str.patientStatusDeteriorating },
  { state: PatientFinalState.STABLE, label: str.patientStatusStable },
  { state: PatientFinalState.IMPROVING, label: str.patientStatusImproving },
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
  if (form.initialStateDescription.trim().length === 0)
    return str.validationCareInitialRequired;
  if (form.treatmentDescription.trim().length === 0)
    return str.validationCareTreatmentRequired;
  if (form.finalState === null) return str.careReportFinalState;
  if (form.finalStateDescription.trim().length === 0)
    return str.validationCareFinalDescRequired;
  return null;
}

export default function PrehospitalCareReport(): ReactElement {
  const router = useRouter();
  const { emergencyAssignmentListener } = useApi();
  const { setActiveEmergency } = useActiveEmergency();
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="px-6 pt-6 flex-1">
          <Text className="text-primary text-2xl font-bold text-center mb-1">
            {str.careReportTitle}
          </Text>
          <Text className="text-gray text-center text-base mb-6">
            {str.careReportSubtitle}
          </Text>

          <Text className="text-text font-bold text-base mb-1">
            {str.careReportInitialState}
          </Text>
          <TextInput
            className="border border-border rounded-md px-4 py-3 mb-4 bg-white min-h-[80px] text-text"
            value={form.initialStateDescription}
            onChangeText={(v) => setField("initialStateDescription", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.careReportInitialStatePlaceholder}
          />

          <Text className="text-text font-bold text-base mb-1">
            {str.careReportTreatment}
          </Text>
          <TextInput
            className="border border-border rounded-md px-4 py-3 mb-4 bg-white min-h-[80px] text-text"
            value={form.treatmentDescription}
            onChangeText={(v) => setField("treatmentDescription", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.careReportTreatmentPlaceholder}
          />

          <Text className="text-text font-bold text-base mb-2">
            {str.careReportFinalState}
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {FINAL_STATES.map((opt) => {
              const isSelected = form.finalState === opt.state;
              return (
                <TouchableOpacity
                  key={opt.state}
                  className={`px-4 py-2 rounded-full border-2 ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-white"
                  }`}
                  onPress={() => setField("finalState", opt.state)}
                >
                  <Text
                    className={isSelected ? "text-primary font-bold" : "text-text"}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text className="text-text font-bold text-base mb-1">
            {str.careReportFinalStateDesc}
          </Text>
          <TextInput
            className="border border-border rounded-md px-4 py-3 mb-6 bg-white min-h-[80px] text-text"
            value={form.finalStateDescription}
            onChangeText={(v) => setField("finalStateDescription", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.careReportFinalStateDescPlaceholder}
          />

          <View className="mb-10">
            <AppButton
              title={str.careReportSubmit}
              loadingTitle={str.careReportSubmitting}
              loading={submitting}
              disabled={submitting}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
