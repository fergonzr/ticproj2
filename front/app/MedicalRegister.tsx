import { Input } from "@rneui/themed";
import { View, Text } from "react-native";
import * as str from "@/lib/strings";
import "../global.css";
import { ReactElement } from "react";
import React, { useState } from "react";
import {
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "@/lib/styles/MedicalRegister.styles";
import DropPickerDown from "@/lib/components/DropPickerDown";
import RadioOption from "@/lib/components/RadioOption";

/**
 * Screen to allow a Citizen to register its medical info.
 * @returns ReactElement
 */


// Types 

type DocumentType = "Cedula" | "Pasaporte" | "Tarjeta de identidad";
type BloodType = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";

interface MedicalFormData {
  nombre: string;
  apellidos: string;
  celular: string;
  tipoDocumento: DocumentType;
  documento: string;
  edad: string;
  alergias: { rinitis: boolean; asma: boolean; dermatitis: boolean };
  enfermedades: string;
  marcaPasos: boolean | null;
  tipoSangre: BloodType;
  autorizaDatos: boolean | null;
}


// Constants

const DOCUMENT_TYPES: DocumentType[] = [
  "Cedula",
  "Pasaporte",
  "Tarjeta de identidad",
];
const BLOOD_TYPES: BloodType[] = [
  "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-",
];
const ENFERMEDADES = [
  "Ninguna", "Tunel carpeano", "Diabetes", "Hipertension", "Epilepsia", "Asma",
];

// Sub-component
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


export default function MedicalRegister(): ReactElement {

  const [form, setForm] = useState<MedicalFormData>({
    nombre: "",
    apellidos: "",
    celular: "",
    tipoDocumento: "Cedula",
    documento: "",
    edad: "",
    alergias: { rinitis: false, asma: false, dermatitis: false },
    enfermedades: "Ninguna",
    marcaPasos: null,
    tipoSangre: "O+",
    autorizaDatos: null,
  });

  const set = (field: keyof MedicalFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.nombre || !form.apellidos || !form.documento) {
      Alert.alert(str.alertError, str.alertMissingFields);
      console.log("Medical register incomplete");
      return;
    }
    if (form.autorizaDatos !== true) {
      Alert.alert(str.alertError, str.alertAuthRequired);
      console.log("Auth error");
      return;
    }
    try {
      await AsyncStorage.setItem("medicalData", JSON.stringify(form));
      Alert.alert(str.alertSuccess, str.alertSaveSuccess);
      console.log("Medical register complete");
    } catch {
      Alert.alert(str.alertError, str.alertSaveError);
    }
  };

  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Header */}
      <View style={styles.header}>
        
        <TouchableOpacity style={styles.pillButton}>
          <Text style={styles.pillButtonText}>{str.btnRegister}</Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelName}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.nombre}
          onChangeText={(v) => set("nombre", v)}
          placeholder={str.labelName}
        />
      </View>

      {/* lastnames*/}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelLastName}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.apellidos}
          onChangeText={(v) => set("apellidos", v)}
          placeholder={str.labelLastName}
        />
      </View>

      {/* cell phone number */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelPhone}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.celular}
          onChangeText={(v) => set("celular", v)}
          keyboardType="phone-pad"
          placeholder={str.labelPhone}
        />
      </View>

      {/* Document type */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelIDType}</Text>
        <View style={styles.rowControl}>
          <DropPickerDown
            options={DOCUMENT_TYPES}
            selected={form.tipoDocumento}
            onSelect={(v) => set("tipoDocumento", v as DocumentType)}
          />
        </View>
      </View>

      {/* Document number*/}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{form.tipoDocumento}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.documento}
          onChangeText={(v) => set("documento", v)}
          keyboardType="numeric"
          placeholder={str.labelID}
        />
      </View>

      {/* Medical data section */}
      <TouchableOpacity style={[styles.pillButton, styles.sectionButton]}>
        <Text style={styles.pillButtonText}>{str.btnMedicalData}</Text>
      </TouchableOpacity>

      {/* Age */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelAge}</Text>
        <TextInput
          style={styles.rowInput}
          value={form.edad}
          onChangeText={(v) => set("edad", v)}
          keyboardType="numeric"
          placeholder={str.labelAge}
        />
      </View>

      {/* Allergies*/}
      <View style={styles.row}>
        <Text style={styles.allergiesLabel}>{str.labelAllergies}</Text>
        <View style={styles.checkboxRow}>
          <CheckboxOption
            label="Rinitis"
            checked={form.alergias.rinitis}
            onToggle={() =>
              set("alergias", { ...form.alergias, rinitis: !form.alergias.rinitis })
            }
          />
          <CheckboxOption
            label="Asma"
            checked={form.alergias.asma}
            onToggle={() =>
              set("alergias", { ...form.alergias, asma: !form.alergias.asma })
            }
          />
          <CheckboxOption
            label="Dermatitis"
            checked={form.alergias.dermatitis}
            onToggle={() =>
              set("alergias", { ...form.alergias, dermatitis: !form.alergias.dermatitis })
            }
          />
        </View>
      </View>

      {/* Diseases */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelDiseases}</Text>
        <View style={styles.rowControl}>
          <DropPickerDown
            options={ENFERMEDADES}
            selected={form.enfermedades}
            onSelect={(v) => set("enfermedades", v)}
          />
        </View>
      </View>

      {/* Pacemaker */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelPacemaker}</Text>
        <View style={styles.radioRow}>
          <RadioOption
            label={str.optionYes}
            selected={form.marcaPasos === true}
            onPress={() => set("marcaPasos", true)}
          />
          <RadioOption
            label={str.optionNo}
            selected={form.marcaPasos === false}
            onPress={() => set("marcaPasos", false)}
          />
        </View>
      </View>

      {/* Blood type */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelBloodType}</Text>
        <View style={styles.rowControl}>
          <DropPickerDown
            options={BLOOD_TYPES}
            selected={form.tipoSangre}
            onSelect={(v) => set("tipoSangre", v as BloodType)}
          />
        </View>
      </View>

      {/* Autorization */}
      <View style={styles.authorizationBox}>
        <Text style={styles.authorizationText}>{str.labelAuthorize}</Text>
        <View style={styles.authorizationRadios}>
          <RadioOption
            label={str.optionYes}
            selected={form.autorizaDatos === true}
            onPress={() => set("autorizaDatos", true)}
          />
          <RadioOption
            label={str.optionNo}
            selected={form.autorizaDatos === false}
            onPress={() => set("autorizaDatos", false)}
          />
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.pillButton, styles.pillButtonNeutral]}
        onPress={handleSave}
      >
        <Text style={styles.pillButtonNeutralText}>{str.btnSaveData}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

}
