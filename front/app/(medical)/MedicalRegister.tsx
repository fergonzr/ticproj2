import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import AppButton from "@/lib/components/AppButton";
import { spacing } from "@/lib/themes/Spacing";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import { useMedicalInfo, MAX_REGISTERED_PERSONS } from "@/lib/hooks/useMedicalInfo";
import { MedicalInfo, DOCUMENT_TYPES, BLOOD_TYPES, ALLERGY_SUGGESTIONS, DISEASE_SUGGESTIONS } from "@/lib/models";
import TagComboInput from "@/lib/components/TagComboInput";
import { MaxPersonsReachedError } from "@/lib/api/errors";
import DropdownPicker from "@/lib/components/DropdownPicker";
import YesNoOption from "@/lib/components/YesNoOption";
import * as str from "@/lib/strings";
import "../../global.css";

// Constants

const EMPTY_FORM: MedicalInfo = {
  firstName: "",
  lastName: "",
  phone: "",
  documentType: "NATIONAL_ID",
  documentNumber: "",
  age: "",
  allergies: [],
  diseases: [],
  hasPacemaker: null,
  bloodType: "O_POSITIVE",
  dataConsent: null,
};

// Validation

function validateMedicalForm(form: MedicalInfo): string | null {
  if (!form.firstName.trim()) return str.validationNameRequired;
  if (!form.lastName.trim()) return str.validationLastNameRequired;
  if (!form.phone.trim()) return str.validationPhoneRequired;
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(form.phone.trim())) return str.validationPhoneDigits;

  if (!form.documentNumber.trim()) return str.validationDocumentRequired;
  const docNumber = form.documentNumber.trim();
  if (docNumber.length < 5) return str.validationDocumentMinLength;
  if (!/^\d+$/.test(docNumber)) return str.validationDocumentOnlyDigits;

  if (!form.age.trim()) return str.validationAgeRequired;
  const age = parseInt(form.age.trim(), 10);
  if (isNaN(age) || age < 0) return str.validationAgeNegative;
  if (age > 100) return str.validationAgeMax;

  if (form.hasPacemaker === null) return str.validationPacemakerRequired;
  if (form.dataConsent !== true) return str.alertAuthRequired;
  return null;
}

// Screen

export default function MedicalRegister() {
  const { index: indexParam } = useLocalSearchParams<{ index?: string }>();
  const {
    medicalInfoList,
    setMedicalInfo,
    addMedicalInfo,
    isLoadingMedicalInfo,
  } = useMedicalInfo();

  const { top } = useSafeAreaInsets();

  const editIndex =
    indexParam !== undefined ? parseInt(indexParam, 10) : null;
  const isEditing = editIndex !== null && !isNaN(editIndex);

  const [form, setFormState] = useState<MedicalInfo>(EMPTY_FORM);

  useEffect(() => {
    if (isLoadingMedicalInfo) return;
    if (isEditing && medicalInfoList[editIndex] !== undefined) {
      setFormState(medicalInfoList[editIndex]);
    } else {
      setFormState(EMPTY_FORM);
    }
  }, [isLoadingMedicalInfo, editIndex]);

  const setField = <K extends keyof MedicalInfo>(
    field: K,
    value: MedicalInfo[K],
  ) => setFormState((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const validationError = validateMedicalForm(form);
    if (validationError) {
      Alert.alert(str.alertError, validationError);
      return;
    }

    if (!isEditing && medicalInfoList.length >= MAX_REGISTERED_PERSONS) {
      Alert.alert(str.alertWarning, str.alertMaxPersonsReached);
      return;
    }

    try {
      if (isEditing) {
        await setMedicalInfo(form, editIndex);
      } else {
        await addMedicalInfo(form);
      }
      Alert.alert(
        str.alertSuccess,
        isEditing ? str.alertUpdateSuccess : str.alertSaveSuccess,
        [{ text: str.btnOK, onPress: () => router.back() }],
      );
    } catch (error) {
      const message =
        error instanceof MaxPersonsReachedError
          ? str.alertMaxPersonsReached
          : str.alertSaveFailed;
      Alert.alert(str.alertError, message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ paddingTop: top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        className="flex flex-col py-10 px-10"
      >
          {/* Names */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelName}</Text>
            <TextInput
              className="flex-1 border border-border rounded-lg px-md py-sm bg-background text-text text-14"
              value={form.firstName}
              onChangeText={(v) => setField("firstName", v)}
              placeholder={str.labelName}
            />
          </View>

          {/* Last names */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelLastName}</Text>
            <TextInput
              className="flex-1 border border-border rounded-lg px-md py-sm bg-background text-text text-14"
              value={form.lastName}
              onChangeText={(v) => setField("lastName", v)}
              placeholder={str.labelLastName}
            />
          </View>

          {/* Cell phone number */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelPhone}</Text>
            <TextInput
              className="flex-1 border border-border rounded-lg px-md py-sm bg-background text-text text-14"
              value={form.phone}
              onChangeText={(v) => setField("phone", v)}
              keyboardType="phone-pad"
              placeholder={str.labelPhone}
            />
          </View>

          {/* Document type */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelIDType}</Text>
            <View className="flex-1">
              <DropdownPicker
                options={Object.keys(DOCUMENT_TYPES)}
                displayValues={DOCUMENT_TYPES}
                selected={form.documentType}
                onSelect={(key) => setField("documentType", key)}
              />
            </View>
          </View>

          {/* Document number */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">
              {DOCUMENT_TYPES[form.documentType]}
            </Text>
            <TextInput
              className="flex-1 border border-border rounded-lg px-md py-sm bg-background text-text text-14"
              value={form.documentNumber}
              onChangeText={(v) => setField("documentNumber", v)}
              keyboardType="numeric"
              placeholder={str.labelID}
            />
          </View>

          {/* Medical data section label */}
          <View
            className="border border-primary rounded-full py-2 items-center mb-4"
            style={{ paddingHorizontal: spacing.lg }}
          >
            <Text className="text-primary font-bold text-base">
              {str.btnMedicalData}
            </Text>
          </View>

          {/* Age */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelAge}</Text>
            <TextInput
              className="flex-1 border border-border rounded-lg px-md py-sm bg-background text-text text-14"
              value={form.age}
              onChangeText={(v) => setField("age", v)}
              keyboardType="numeric"
              placeholder={str.labelAge}
            />
          </View>

          {/* Allergies */}
          <View className="mb-4">
            <Text className="text-text text-14 mb-2">{str.labelAllergies}</Text>
            <TagComboInput
              values={form.allergies}
              onChange={(v) => setField("allergies", v)}
              suggestions={ALLERGY_SUGGESTIONS}
              placeholder={str.placeholderAllergies}
            />
          </View>

          {/* Diseases */}
          <View className="mb-4">
            <Text className="text-text text-14 mb-2">{str.labelDiseases}</Text>
            <TagComboInput
              values={form.diseases}
              onChange={(v) => setField("diseases", v)}
              suggestions={DISEASE_SUGGESTIONS}
              placeholder={str.placeholderDiseases}
            />
          </View>

          {/* Pacemaker */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelPacemaker}</Text>
            <YesNoOption
              value={form.hasPacemaker}
              onChange={(v) => setField("hasPacemaker", v)}
            />
          </View>

          {/* Blood type */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelBloodType}</Text>
            <View className="flex-1">
              <DropdownPicker
                options={Object.keys(BLOOD_TYPES)}
                displayValues={BLOOD_TYPES}
                selected={form.bloodType}
                onSelect={(key) => setField("bloodType", key)}
              />
            </View>
          </View>

          {/* Data authorization consent */}
          <View className="border border-border rounded-lg p-4 mb-6">
            <Text className="text-center text-text mb-4 text-14">
              {str.labelAuthorize}
            </Text>
            <View className="flex-row justify-center">
              <YesNoOption
                value={form.dataConsent}
                onChange={(v) => setField("dataConsent", v)}
              />
            </View>
          </View>

          {/* Save button */}
          <AppButton
            title={isEditing ? str.btnUpdateData : str.btnSaveData}
            onPress={handleSave}
            style={{ marginBottom: 12 }}
          />

          {/* Cancel button */}
          <AppButton
            variant="outline"
            title={str.btnCancel}
            onPress={() => router.back()}
            style={{ marginBottom: 64 }}
          />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
