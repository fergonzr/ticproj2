import { Input } from "@rneui/themed";
import { View, Text } from "react-native";
import * as str from "@/lib/strings";
import "../global.css";
import { ReactElement } from "react";

/**
 * Screen to allow a Citizen to register its medical info.
 * @returns ReactElement
 */

import { useMedicalInfo } from "@/lib/hooks/useMedicalInfo";
import { MedicalInfo } from "@/lib/models";
import styles from "@/lib/styles/MedicalRegister.styles";
import DropdownPicker from "@/lib/components/DropdownPicker";
import RadioOption from "@/lib/components/RadioOption";
import React, { useState } from "react";
import { TextInput, ScrollView, TouchableOpacity, Alert } from "react-native";
import { DOCUMENT_TYPES, BLOOD_TYPES, DISEASES } from "@/lib/models";

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
    <TouchableOpacity style={styles.checkboxItem} onPress={onToggle}>
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Screen

export default function MedicalRegister() {
  const { medicalInfo, setMedicalInfo } = useMedicalInfo();
  const [form, setForm] = useState<MedicalInfo>(medicalInfo || EMPTY_FORM);

  const setField = <K extends keyof MedicalInfo>(
    field: K,
    value: MedicalInfo[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const validationError = validateMedicalForm(form);
    if (validationError) {
      Alert.alert(str.alertError, validationError);
      console.log("Validation error");
      return;
    }
    setMedicalInfo(form);
    Alert.alert(str.alertSuccess, str.alertSaveSuccess);
    console.log("Medical info saved successfully");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity style={styles.pillButton}>
          <Text style={styles.pillButtonText}>{str.btnRegister}</Text>
        </TouchableOpacity>
      </View>

      {/* Names */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelName}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.firstName}
          onChangeText={(v) => setField("firstName", v)}
          placeholder={str.labelName}
        />
      </View>

      {/* lastnames */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelLastName}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.lastName}
          onChangeText={(v) => setField("lastName", v)}
          placeholder={str.labelLastName}
        />
      </View>

      {/* cell phone number */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelPhone}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.phone}
          onChangeText={(v) => setField("phone", v)}
          keyboardType="phone-pad"
          placeholder={str.labelPhone}
        />
      </View>

      {/* Document type */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelIDType}</Text>
        <View style={styles.rowControl}>
          <DropdownPicker
            options={Object.keys(DOCUMENT_TYPES)}
            displayValues={DOCUMENT_TYPES}
            selected={form.documentType}
            onSelect={(key) => setField("documentType", key)}
          />
        </View>
      </View>

      {/* Document number — label shows the selected document type display name */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{DOCUMENT_TYPES[form.documentType]}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.documentNumber}
          onChangeText={(v) => setField("documentNumber", v)}
          keyboardType="numeric"
          placeholder={str.labelID}
        />
      </View>

      {/* Medical data */}
      <TouchableOpacity style={[styles.pillButton, styles.sectionButton]}>
        <Text style={styles.pillButtonText}>{str.btnMedicalData}</Text>
      </TouchableOpacity>

      {/* Age */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelAge}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.age}
          onChangeText={(v) => setField("age", v)}
          keyboardType="numeric"
          placeholder={str.labelAge}
        />
      </View>

      {/* Allergies */}
      <View style={styles.row}>
        <Text style={styles.allergiesLabel}>{str.labelAllergies}</Text>
        <View style={styles.checkboxRow}>
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
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelDiseases}</Text>
        <View style={styles.rowControl}>
          <DropdownPicker
            options={Object.keys(DISEASES)}
            displayValues={DISEASES}
            selected={form.disease}
            onSelect={(key) => setField("disease", key)}
          />
        </View>
      </View>

      {/* Pacemaker */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelPacemaker}</Text>
        <View style={styles.radioRow}>
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
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelBloodType}</Text>
        <View style={styles.rowControl}>
          <DropdownPicker
            options={Object.keys(BLOOD_TYPES)}
            displayValues={BLOOD_TYPES}
            selected={form.bloodType}
            onSelect={(key) => setField("bloodType", key)}
          />
        </View>
      </View>

      {/* Data authorization consent */}
      <View style={styles.authorizationBox}>
        <Text style={styles.authorizationText}>{str.labelAuthorize}</Text>
        <View style={styles.authorizationRadios}>
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
        style={[styles.pillButton, styles.pillButtonNeutral]}
        onPress={handleSave}
      >
        <Text style={styles.pillButtonNeutralText}>{str.btnSaveData}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
