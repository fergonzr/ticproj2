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
import * as str from "@/lib/strings";
import "../global.css";
import AntDesign from "@expo/vector-icons/AntDesign";

/**
 * Screen to allow a Citizen to register its medical info.
 * @returns ReactElement
 */

import { useMedicalInfo } from "@/lib/hooks/useMedicalInfo";
import { MedicalInfo } from "@/lib/models";
import DropdownPicker from "@/lib/components/DropdownPicker";
import RadioOption from "@/lib/components/RadioOption";
import PersonSelector from "@/lib/components/PersonSelector";
import React, { useState, useEffect } from "react";
import { DOCUMENT_TYPES, BLOOD_TYPES, DISEASES } from "@/lib/models";
import { Button, useTheme } from "@rneui/themed";
import { SafeAreaView } from "react-native-safe-area-context";

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

//Validation

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
  const {
    medicalInfoList,
    selectedPersonIndex,
    setMedicalInfo,
    addMedicalInfo,
    removeMedicalInfo,
    setSelectedPersonIndex,
    isLoadingMedicalInfo,
  } = useMedicalInfo();
  const [form, setForm] = useState<MedicalInfo>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const { theme } = useTheme();

  // Effect to load selected person's data
  useEffect(() => {
    if (isLoadingMedicalInfo) return;

    if (selectedPersonIndex !== null && medicalInfoList.length > 0) {
      setForm(medicalInfoList[selectedPersonIndex]);
      setIsEditing(true);
    } else {
      setForm(EMPTY_FORM);
      setIsEditing(false);
    }
  }, [selectedPersonIndex, medicalInfoList, isLoadingMedicalInfo]);

  const setField = <K extends keyof MedicalInfo>(
    field: K,
    value: MedicalInfo[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const validationError = validateMedicalForm(form);
    if (validationError) {
      Alert.alert(str.alertError, validationError);
      console.log("Validation error");
      return;
    }

    try {
      if (isEditing && selectedPersonIndex !== null) {
        await setMedicalInfo(form, selectedPersonIndex);
      } else {
        await addMedicalInfo(form);
      }
      Alert.alert(
        str.alertSuccess,
        isEditing ? str.alertUpdateSuccess : str.alertSaveSuccess,
      );
      console.log("Medical info saved successfully");
    } catch (error) {
      Alert.alert(str.alertError, str.alertSaveFailed);
      console.error("Failed to save medical info", error);
    }
  };

  const handleDelete = () => {
    if (selectedPersonIndex === null) return;

    Alert.alert(str.alertConfirmDelete, str.alertConfirmDeleteMessage, [
      { text: str.btnCancel, style: "cancel" },
      {
        text: str.btnDelete,
        style: "destructive",
        onPress: async () => {
          try {
            await removeMedicalInfo(selectedPersonIndex);
            Alert.alert(str.alertSuccess, str.alertDeleteSuccess);
          } catch (error) {
            Alert.alert(str.alertError, str.alertDeleteFailed);
            console.error("Failed to delete medical info", error);
          }
        },
      },
    ]);
  };

  const handleNewPerson = () => {
    setSelectedPersonIndex(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["bottom"]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex flex-col py-10 px-10"
        >
          {/* Person Selector */}
          <View className="flex flex-row align-middle justify-center mb-4">
            <View className="flex-1 mr-4">
              <PersonSelector
                medicalInfoList={
                  isEditing ? medicalInfoList : [...medicalInfoList, form]
                }
                selectedPersonIndex={
                  isEditing ? selectedPersonIndex : medicalInfoList.length
                }
                onSelect={setSelectedPersonIndex}
                showThirdPartyOption={false}
              />
            </View>

            <View className="flex-row items-center justify-between gap-2">
              {/* New Person button */}
              {/* Delete button (only show when editing existing person) */}
              <TouchableOpacity
                onPress={handleNewPerson}
                className="bg-primarypale px-2 py-2 rounded-md py-sm px-lg items-center mx-sm"
              >
                <AntDesign
                  name="user-add"
                  size={20}
                  color={theme.colors.primary}
                  className="text-danger font-600 text-15"
                />
              </TouchableOpacity>
              {isEditing && selectedPersonIndex !== null && (
                <TouchableOpacity
                  className="bg-dangerpale px-2 py-2 rounded-md py-sm px-lg items-center mx-sm"
                  onPress={handleDelete}
                >
                  <AntDesign
                    name="user-delete"
                    size={20}
                    color={theme.colors.error}
                    className="text-danger font-600 text-15"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

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

          {/* lastnames */}
          <View className="flex-row items-center mb-4 justify-between">
            <Text className="w-28 text-text text-14">{str.labelLastName}</Text>
            <TextInput
              className="flex-1 border border-border rounded-lg px-md py-sm bg-background text-text text-14"
              value={form.lastName}
              onChangeText={(v) => setField("lastName", v)}
              placeholder={str.labelLastName}
            />
          </View>

          {/* cell phone number */}
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

          {/* Document number — label shows the selected document type display name */}
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

          {/* Medical data */}
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
                label="Rinitis"
                checked={form.allergies.rhinitis}
                onToggle={() =>
                  setField("allergies", {
                    ...form.allergies,
                    rhinitis: !form.allergies.rhinitis,
                  })
                }
              />
              <CheckboxOption
                label="Asma"
                checked={form.allergies.asthma}
                onToggle={() =>
                  setField("allergies", {
                    ...form.allergies,
                    asthma: !form.allergies.asthma,
                  })
                }
              />
              <CheckboxOption
                label="Dermatitis"
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

          {/* diseases*/}
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
            <View className="flex-row">
              <RadioOption
                label={str.optionYes}
                selected={form.hasPacemaker === true}
                onPress={() => setField("hasPacemaker", true)}
              />
              <RadioOption
                label={str.optionNo}
                selected={form.hasPacemaker === false}
                onPress={() => setField("hasPacemaker", false)}
              />
            </View>
          </View>

          {/* blood type */}
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
              <RadioOption
                label={str.optionYes}
                selected={form.dataConsent === true}
                onPress={() => setField("dataConsent", true)}
              />
              <RadioOption
                label={str.optionNo}
                selected={form.dataConsent === false}
                onPress={() => setField("dataConsent", false)}
              />
            </View>
          </View>

          {/* save btn */}
          <TouchableOpacity
            className="bg-primarypale rounded-full py-2 px-lg items-center mb-16"
            onPress={handleSave}
          >
            <Text className="text-primaryshade font-bold text-center">
              {isEditing ? str.btnUpdateData : str.btnSaveData}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
