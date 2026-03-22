import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import React, { useState, useEffect } from "react";
import { useMedicalInfo, MAX_REGISTERED_PERSONS } from "@/lib/hooks/useMedicalInfo";
import { MedicalInfo, DOCUMENT_TYPES, BLOOD_TYPES, DISEASES } from "@/lib/models";
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
  allergies: { rhinitis: false, asthma: false, dermatitis: false },
  disease: "NONE",
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

// Sub-components

function CheckboxOption({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center mr-2 gap-1"
      onPress={onToggle}
    >
      <View
        className={"border border-1 w-6 h-6 " + (checked ? "bg-black" : "")}
      >
        {checked && (
          <Text className="text-center text-4 font-bold text-white">✓</Text>
        )}
      </View>
      <Text className="text-text text-14">{label}</Text>
    </TouchableOpacity>
  );
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
          <TouchableOpacity className="border border-primary rounded-full py-2 px-lg items-center mb-4">
            <Text className="text-primary text-15 font-bold">
              {str.btnMedicalData}
            </Text>
          </TouchableOpacity>

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
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelAllergies}</Text>
            <View className="flex-row flex-wrap">
              <CheckboxOption
                label={str.allergyRhinitis}
                checked={form.allergies.rhinitis}
                onToggle={() =>
                  setField("allergies", {
                    ...form.allergies,
                    rhinitis: !form.allergies.rhinitis,
                  })
                }
              />
              <CheckboxOption
                label={str.allergyAsthma}
                checked={form.allergies.asthma}
                onToggle={() =>
                  setField("allergies", {
                    ...form.allergies,
                    asthma: !form.allergies.asthma,
                  })
                }
              />
              <CheckboxOption
                label={str.allergyDermatitis}
                checked={form.allergies.dermatitis}
                onToggle={() =>
                  setField("allergies", {
                    ...form.allergies,
                    dermatitis: !form.allergies.dermatitis,
                  })
                }
              />
            </View>
          </View>

          {/* Diseases */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelDiseases}</Text>
            <View className="flex-1">
              <DropdownPicker
                options={Object.keys(DISEASES)}
                displayValues={DISEASES}
                selected={form.disease}
                onSelect={(key) => setField("disease", key)}
              />
            </View>
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
          <TouchableOpacity
            className="bg-primarypale rounded-full py-2 px-lg items-center mb-3"
            onPress={handleSave}
          >
            <Text className="text-primaryshade font-bold text-center">
              {isEditing ? str.btnUpdateData : str.btnSaveData}
            </Text>
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            className="border border-border rounded-full py-2 px-lg items-center mb-16"
            onPress={() => router.back()}
          >
            <Text className="text-text text-center">{str.btnCancel}</Text>
          </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
