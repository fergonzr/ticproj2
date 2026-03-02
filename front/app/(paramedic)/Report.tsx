import { ReactElement } from "react";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as str from "@/lib/strings";
import DropdownPicker from "@/lib/components/DropdownPicker";
import RadioOption from "@/lib/components/RadioOption";
import { useApi } from "@/lib/api/useApi";
import {
  BLEEDING_LEVELS,
  CaseReport,
  EmergencyCase,
  MedicalInfo,
  PATIENT_STATUSES,
  BLOOD_TYPES,
  DISEASES,
} from "@/lib/models";
import { Button } from "@react-navigation/elements";
import { useParamedicLocationTracking } from "@/lib/hooks/useParamedicLocationTracking";
import { MockParamedicLocationTracker } from "@/lib/api/mock";

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
    <View className="flex-row mb-xs">
      <Text className="text-textLight w-30 text-14">{label}:</Text>
      <Text className="text-text flex-1 text-14">{value}</Text>
    </View>
  );
}

// Helpers

function formatAllergies(allergies?: MedicalInfo["allergies"]): string {
  if (!allergies) return "—";
  const list: string[] = [];
  if (allergies.rhinitis) list.push("Rinitis");
  if (allergies.asthma) list.push("Asma");
  if (allergies.dermatitis) list.push("Dermatitis");
  return list.length ? list.join(", ") : "Ninguna";
}

function formatPacemaker(value?: boolean | null): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "—";
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
    } catch {
      Alert.alert(str.alertError, str.alertReportError);
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
      className="bg-background"
    >
      <ScrollView className="px-lg pb-xxl">
        {/* Register — autocompleted from EmergencyCase */}
        <View className="border border-border rounded-lg p-md mb-lg">
          <Text className="text-primary font-bold text-17 text-center mb-md">
            {str.sectionRecord}
          </Text>
          <InfoRow
            label="Nombre"
            value={medical ? `${medical.firstName} ${medical.lastName}` : "—"}
          />
          <InfoRow
            label={str.labelAge}
            value={medical ? `${medical.age} años` : "—"}
          />
          <InfoRow
            label={str.labelAllergies}
            value={formatAllergies(medical?.allergies)}
          />
          <InfoRow
            label={str.labelDiseases}
            value={medical ? (DISEASES[medical.disease] ?? "—") : "—"}
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
        <View className="border border-border rounded-lg p-md mb-lg">
          <Text className="text-primary font-bold text-17 text-center mb-md">
            {str.sectionTriage}
          </Text>

          {/* Bleeding */}
          <View className="flex-row items-center mb-md">
            <Text className="text-text w-28 text-14">{str.labelBleeding}:</Text>
            <DropdownPicker
              options={Object.keys(BLEEDING_LEVELS)}
              displayValues={BLEEDING_LEVELS}
              selected={form.bleedingLevel}
              onSelect={(key) => setField("bleedingLevel", key)}
            />
          </View>

          {/* Contusion */}
          <View className="flex-row items-center mb-md">
            <Text className="text-text w-28 text-14">
              {str.labelContusion}:
            </Text>
            <View className="flex-row">
              <RadioOption
                label={str.optionYes}
                selected={form.hasBruise === true}
                onPress={() => setField("hasBruise", true)}
              />
              <RadioOption
                label={str.optionNo}
                selected={form.hasBruise === false}
                onPress={() => setField("hasBruise", false)}
              />
            </View>
          </View>

          {/* Fracture */}
          <View className="flex-row items-center mb-md">
            <Text className="text-text w-28 text-14">{str.labelFracture}:</Text>
            <View className="flex-row">
              <RadioOption
                label={str.optionYes}
                selected={form.hasFracture === true}
                onPress={() => setField("hasFracture", true)}
              />
              <RadioOption
                label={str.optionNo}
                selected={form.hasFracture === false}
                onPress={() => setField("hasFracture", false)}
              />
            </View>
          </View>

          {/* Unconscious */}
          <View className="flex-row items-center mb-md">
            <Text className="text-text w-28 text-14">
              {str.labelUnconscious}:
            </Text>
            <View className="flex-row">
              <RadioOption
                label={str.optionYes}
                selected={form.isUnconscious === true}
                onPress={() => setField("isUnconscious", true)}
              />
              <RadioOption
                label={str.optionNo}
                selected={form.isUnconscious === false}
                onPress={() => setField("isUnconscious", false)}
              />
            </View>
          </View>

          {/* treatment */}
          <Text className="text-center text-text text-14 mb-sm">
            {str.labelTreatment}
          </Text>
          <TextInput
            className="border border-border rounded-md px-md py-sm mb-md bg-background min-h-20 text-text text-14"
            value={form.treatment}
            onChangeText={(v) => setField("treatment", v)}
            multiline
            textAlignVertical="top"
            placeholder={str.placeholderTreatment}
          />

          {/* pacient's state */}
          <View className="flex-row items-center mb-md">
            <Text className="text-text w-28 text-14">
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
        <View className="flex-row justify-between">
          <TouchableOpacity
            className="border border-borderButton rounded-full py-sm px-xl"
            onPress={handleCancel}
          >
            <Text className="text-text font-600 text-15">{str.btnCancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={[
              "border border-borderButton rounded-full py-sm px-xl",
              submitting && "opacity-50",
            ].join()}
            onPress={handleSend}
            disabled={submitting}
          >
            <Text className="text-text font-600 text-15">
              {submitting ? str.btnSending : str.btnSend}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
