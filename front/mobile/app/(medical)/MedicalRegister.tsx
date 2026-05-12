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
import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import { useMedicalInfo, MAX_REGISTERED_PERSONS } from "@/lib/hooks/useMedicalInfo";
import {
  MedicalInfo,
  DOCUMENT_TYPES,
  BLOOD_TYPES,
  ALLERGY_SUGGESTIONS,
  DISEASE_SUGGESTIONS,
} from "@/lib/models";
import TagComboInput from "@/lib/components/TagComboInput";
import { MaxPersonsReachedError } from "@/lib/api/errors";
import DropdownPicker from "@/lib/components/DropdownPicker";
import YesNoOption from "@/lib/components/YesNoOption";
import * as str from "@/lib/strings";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, SectionLabel, PillButton } from "@/lib/components/cl";
import "../../global.css";

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

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: mobileColors.textMid,
          marginBottom: 6,
          fontFamily: "Inter_600SemiBold",
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          height: 46,
          paddingHorizontal: 14,
          backgroundColor: mobileColors.surface,
          borderWidth: 1,
          borderColor: mobileColors.border,
          borderRadius: mobileRadii.md,
          fontSize: 15,
          color: mobileColors.text,
          fontFamily: "Inter_400Regular",
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={mobileColors.textSoft}
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

export default function MedicalRegister() {
  const { index: indexParam } = useLocalSearchParams<{ index?: string }>();
  const { medicalInfoList, setMedicalInfo, addMedicalInfo, isLoadingMedicalInfo } = useMedicalInfo();
  const { bottom } = useSafeAreaInsets();

  const editIndex = indexParam !== undefined ? parseInt(indexParam, 10) : null;
  const isEditing = editIndex !== null && !isNaN(editIndex);

  const [form, setFormState] = useState<MedicalInfo>(EMPTY_FORM);

  useEffect(() => {
    if (isLoadingMedicalInfo) return;
    setFormState(isEditing && medicalInfoList[editIndex!] !== undefined ? medicalInfoList[editIndex!] : EMPTY_FORM);
  }, [isLoadingMedicalInfo, editIndex]);

  const setField = <K extends keyof MedicalInfo>(field: K, value: MedicalInfo[K]) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const err = validateMedicalForm(form);
    if (err) { Alert.alert(str.alertError, err); return; }
    if (!isEditing && medicalInfoList.length >= MAX_REGISTERED_PERSONS) {
      Alert.alert(str.alertWarning, str.alertMaxPersonsReached); return;
    }
    try {
      if (isEditing) { await setMedicalInfo(form, editIndex!); }
      else { await addMedicalInfo(form); }
      Alert.alert(
        str.alertSuccess,
        isEditing ? str.alertUpdateSuccess : str.alertSaveSuccess,
        [{ text: str.btnOK, onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(str.alertError, error instanceof MaxPersonsReachedError ? str.alertMaxPersonsReached : str.alertSaveFailed);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: mobileColors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AppBar
        title={str.medicalRegister}
        subtitle={isEditing ? `${form.firstName} ${form.lastName}`.trim() || undefined : undefined}
        leading={
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color={mobileColors.text} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: bottom + 32, gap: 4 }}
      >
        {/* Identity section */}
        <SectionLabel style={{ marginBottom: 12 }}>Identidad</SectionLabel>
        <InputField label={str.labelName}     value={form.firstName}     onChangeText={(v) => setField("firstName", v)} />
        <InputField label={str.labelLastName} value={form.lastName}      onChangeText={(v) => setField("lastName", v)} />
        <InputField label={str.labelPhone}    value={form.phone}         onChangeText={(v) => setField("phone", v)} keyboardType="phone-pad" />

        {/* Document */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: mobileColors.textMid, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>
            {str.labelIDType}
          </Text>
          <DropdownPicker
            options={Object.keys(DOCUMENT_TYPES)}
            displayValues={DOCUMENT_TYPES}
            selected={form.documentType}
            onSelect={(key) => setField("documentType", key)}
          />
        </View>
        <InputField label={DOCUMENT_TYPES[form.documentType]} value={form.documentNumber} onChangeText={(v) => setField("documentNumber", v)} keyboardType="numeric" />

        {/* Medical section */}
        <SectionLabel style={{ marginTop: 8, marginBottom: 12 }}>Datos médicos</SectionLabel>
        <InputField label={str.labelAge} value={form.age} onChangeText={(v) => setField("age", v)} keyboardType="numeric" />

        {/* Blood type */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: mobileColors.textMid, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>
            {str.labelBloodType}
          </Text>
          <DropdownPicker
            options={Object.keys(BLOOD_TYPES)}
            displayValues={BLOOD_TYPES}
            selected={form.bloodType}
            onSelect={(key) => setField("bloodType", key)}
          />
        </View>

        {/* Allergies */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: mobileColors.textMid, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>
            {str.labelAllergies}
          </Text>
          <TagComboInput values={form.allergies} onChange={(v) => setField("allergies", v)} suggestions={ALLERGY_SUGGESTIONS} placeholder={str.placeholderAllergies} />
        </View>

        {/* Diseases */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: mobileColors.textMid, marginBottom: 6, fontFamily: "Inter_600SemiBold" }}>
            {str.labelDiseases}
          </Text>
          <TagComboInput values={form.diseases} onChange={(v) => setField("diseases", v)} suggestions={DISEASE_SUGGESTIONS} placeholder={str.placeholderDiseases} />
        </View>

        {/* Pacemaker */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 }}>
          <Text style={{ flex: 1, fontSize: 14, color: mobileColors.text, fontFamily: "Inter_400Regular" }}>
            {str.labelPacemaker}
          </Text>
          <YesNoOption value={form.hasPacemaker} onChange={(v) => setField("hasPacemaker", v)} />
        </View>

        {/* Consent */}
        <ClinicalCard style={{ marginBottom: 16 }}>
          <Text style={{ textAlign: "center", color: mobileColors.textMid, marginBottom: 12, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 }}>
            {str.labelAuthorize}
          </Text>
          <View style={{ alignItems: "center" }}>
            <YesNoOption value={form.dataConsent} onChange={(v) => setField("dataConsent", v)} />
          </View>
        </ClinicalCard>

        {/* Actions */}
        <PillButton label={isEditing ? str.btnUpdateData : str.btnSaveData} full size="lg" onPress={handleSave} style={{ marginBottom: 10 }} />
        <PillButton label={str.btnCancel} variant="outline" full size="lg" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
