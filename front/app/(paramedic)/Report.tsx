import { ReactElement } from "react";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import AppButton from "@/lib/components/AppButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as str from "@/lib/strings";
import DropdownPicker from "@/lib/components/DropdownPicker";
import RadioOption from "@/lib/components/RadioOption";
import YesNoOption from "@/lib/components/YesNoOption";
import { useApi } from "@/lib/api/useApi";
import { ReportSubmissionError } from "@/lib/api/errors";
import {
  BLEEDING_LEVELS,
  CaseReport,
  EmergencyCase,
  PATIENT_STATUSES,
  BLOOD_TYPES,
} from "@/lib/models";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";

/**
 * Screen to allow a Paramedic to fill a report of an emergency.
 *
 * @returns ReactElement
 */

type TriageForm = Omit<CaseReport, "emergencyCase" | "submittedOn">;

const EMPTY_TRIAGE: TriageForm = {
  bleedingLevel: "NONE",
  hasBruise: false,
  hasFracture: false,
  isUnconscious: false,
  treatment: "",
  patientStatus: "NONE",
};

function validateTriageForm(form: TriageForm): string | null {
  if (form.bleedingLevel === "NONE") return str.validationBleedingRequired;
  if (form.patientStatus === "NONE") return str.validationPatientStatusRequired;
  if (form.treatment.trim().length === 0)
    return str.validationTreatmentRequired;
  return null;
}

// Sub-components

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <View className="flex-row mb-1">
      <Text className="text-gray w-32 text-sm">{label}:</Text>
      <Text className="text-black flex-1 text-sm">{value}</Text>
    </View>
  );
}

// Helpers

function formatAllergies(allergies?: string[]): string {
  if (!allergies) return str.valueMissing;
  return allergies.length > 0 ? allergies.join(", ") : str.optionNoneF;
}

function formatPacemaker(value?: boolean | null): string {
  if (value === true) return str.optionYes;
  if (value === false) return str.optionNo;
  return str.valueMissing;
}

export default function Report(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ emergencyCase: string }>();
  const { caseReportSubmitter, paramedicLocationTracker: locationTracker } =
    useApi();

  const [emergencyCase, setEmergencyCase] = useState<EmergencyCase | null>(
    null,
  );
  const [form, setForm] = useState<TriageForm>(EMPTY_TRIAGE);
  const [submitting, setSubmitting] = useState(false);

  // Initialize location tracking
  const locationTracking = useParamedicLocationTracking({
    locationTracker,
    updateIntervalMs: 10000,
    distanceInterval: 50,
  });

  // Parse the EmergencyCase passed as a route param
  useEffect(() => {
    if (params.emergencyCase) {
      try {
        setEmergencyCase(JSON.parse(params.emergencyCase) as EmergencyCase);
      } catch {
        console.warn("Report: could not parse emergencyCase param");
      }
    }
  }, [params.emergencyCase]);

  const setField = <K extends keyof TriageForm>(
    field: K,
    value: TriageForm[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSend = async () => {
    if (!emergencyCase) {
      Alert.alert(str.alertError, str.alertNoEmergencyCase);
      return;
    }
    const validationError = validateTriageForm(form);
    if (validationError) {
      Alert.alert(str.alertError, validationError);
      console.log("Validation error");
      return;
    }
    const report: CaseReport = {
      ...form,
      emergencyCase,
      submittedOn: new Date(),
    };
    try {
      setSubmitting(true);
      await caseReportSubmitter.submitReport(report);
      console.log("Report submitted");
      router.replace("/(paramedic)/EmergencyBrowser");
    } catch (error) {
      const message =
        error instanceof ReportSubmissionError
          ? str.alertReportError
          : str.alertError;
      Alert.alert(str.alertError, message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_TRIAGE);
    router.back();
  };

  const medical = emergencyCase?.medicalInfo;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "position"}
      className="bg-white"
    >
      <ScrollView className="px-6 pt-4 pb-10">
        {/* Register — autocompleted from EmergencyCase */}
        <View className="border border-gray rounded-lg p-4 mb-4">
          <Text className="text-primary font-bold italic text-lg text-center mb-3">
            {str.sectionRecord}
          </Text>
          <InfoRow label={str.labelName} value={medical?.firstName ?? str.valueMissing} />
          <InfoRow label={str.labelLastName} value={medical?.lastName ?? str.valueMissing} />
          <InfoRow
            label={str.labelAge}
            value={medical ? `${medical.age} ${str.unitYears}` : str.valueMissing}
          />
          <InfoRow
            label={str.labelAllergies}
            value={formatAllergies(medical?.allergies)}
          />
          <InfoRow
            label={str.labelDiseases}
            value={medical ? (medical.diseases?.join(", ") || str.optionNoneF) : str.valueMissing}
          />
          <InfoRow
            label={str.labelPacemaker}
            value={formatPacemaker(medical?.hasPacemaker)}
          />
          <InfoRow
            label={str.labelBloodType}
            value={medical ? (BLOOD_TYPES[medical.bloodType] ?? "—") : "—"}
          />
        </View>

        {/* Triage */}
        <Text className="text-primary font-bold italic text-lg text-center mb-3">
          {str.sectionTriage}
        </Text>
        <View className="border border-gray rounded-lg p-4 mb-4">
          {/* Bleeding */}
          <View className="flex-row items-center mb-3">
            <Text className="text-black w-28 text-sm">
              {str.labelBleeding}:
            </Text>
            <DropdownPicker
              options={Object.keys(BLEEDING_LEVELS)}
              displayValues={BLEEDING_LEVELS}
              selected={form.bleedingLevel}
              onSelect={(key) => setField("bleedingLevel", key)}
            />
          </View>

          {/* Contusion */}
          <View className="flex-row items-center mb-3">
            <Text className="text-black w-28 text-sm">
              {str.labelContusion}:
            </Text>
            <YesNoOption
              value={form.hasBruise}
              onChange={(v) => setField("hasBruise", v)}
            />
          </View>

          {/* Fracture */}
          <View className="flex-row items-center mb-3">
            <Text className="text-black w-28 text-sm">
              {str.labelFracture}:
            </Text>
            <YesNoOption
              value={form.hasFracture}
              onChange={(v) => setField("hasFracture", v)}
            />
          </View>

          {/* Unconscious */}
          <View className="flex-row items-center mb-3">
            <Text className="text-black w-28 text-sm">
              {str.labelUnconscious}:
            </Text>
            <YesNoOption
              value={form.isUnconscious}
              onChange={(v) => setField("isUnconscious", v)}
            />
          </View>

          {/* treatment */}
          <Text className="text-center text-black text-sm mb-2">
            {str.labelTreatment}
          </Text>
          <TextInput
            className="border border-gray rounded-md px-4 py-2 mb-3 bg-white min-h-[80px] text-black text-sm"
            value={form.treatment}
            onChangeText={(v) => setField("treatment", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.placeholderTreatment}
          />

          {/* pacient's state */}
          <View className="flex-row items-center mb-3">
            <Text className="text-black w-28 text-sm">
              {str.labelPatientStatus}
            </Text>
            <DropdownPicker
              options={Object.keys(PATIENT_STATUSES)}
              displayValues={PATIENT_STATUSES}
              selected={form.patientStatus}
              onSelect={(key) => setField("patientStatus", key)}
            />
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row justify-between mt-2 mb-6">
          <AppButton
            variant="outline"
            title={str.btnCancel}
            onPress={handleCancel}
          />
          <AppButton
            title={str.btnSend}
            loadingTitle={str.btnSending}
            loading={submitting}
            onPress={handleSend}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
