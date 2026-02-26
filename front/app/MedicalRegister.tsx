import { Input } from "@rneui/themed";
import { View, Text } from "react-native";
import * as str from "@/lib/strings";
import "../global.css";
import { ReactElement } from "react";

/**
 * Screen to allow a Citizen to register its medical info.
 * @returns ReactElement
 */

import { useMedicalInfo } from "@/lib/api/useApi";
import { MedicalInfo } from "@/lib/models";
import styles from "@/lib/styles/MedicalRegister.styles";
import DropdownPicker from "@/lib/components/DropdownPicker";
import RadioOption from "@/lib/components/RadioOption";
import React, { useState } from "react";
import {
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

// Constants 

const DOCUMENT_TYPES: MedicalInfo["tipoDocumento"][] = [
  "Cedula",
  "Pasaporte",
  "Tarjeta de identidad",
];

const BLOOD_TYPES: MedicalInfo["tipoSangre"][] = [
  "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-",
];

const ENFERMEDADES = [
  "Ninguna", "Tunel carpeano", "Diabetes", "Hipertension", "Epilepsia", "Asma",
];

const EMPTY_FORM: MedicalInfo = {
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
};

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
  const { setMedicalInfo } = useMedicalInfo();
  const [form, setForm] = useState<MedicalInfo>(EMPTY_FORM);

  const set = <K extends keyof MedicalInfo>(field: K, value: MedicalInfo[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.nombre || !form.apellidos || !form.documento) {
      Alert.alert(str.alertError, str.alertMissingFields);
      return;
    }
    if (form.autorizaDatos !== true) {
      Alert.alert(str.alertError, str.alertAuthRequired);
      return;
    }
    setMedicalInfo(form);
    Alert.alert(str.alertSuccess, str.alertSaveSuccess);
    console.log("Medical info complete");
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
          value={form.nombre}
          onChangeText={(v) => set("nombre", v)}
          placeholder={str.labelName}
        />
      </View>

      {/* lastnames */}
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
          <DropdownPicker
            options={DOCUMENT_TYPES}
            selected={form.tipoDocumento}
            onSelect={(v) => set("tipoDocumento", v as MedicalInfo["tipoDocumento"])}
          />
        </View>
      </View>

      {/* Document */}
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

      {/* Medical data */}
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

      {/* Allergies */}
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

      {/* diseases*/}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelDiseases}</Text>
        <View style={styles.rowControl}>
          <DropdownPicker
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

      {/* blood type */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{str.labelBloodType}</Text>
        <View style={styles.rowControl}>
          <DropdownPicker
            options={BLOOD_TYPES}
            selected={form.tipoSangre}
            onSelect={(v) => set("tipoSangre", v as MedicalInfo["tipoSangre"])}
          />
        </View>
      </View>

      {/* consent*/}
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

/** 
export default function MedicalRegister(): ReactElement {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Input label={<Text>{str.labelName}</Text>} placeholder="Salomé"></Input>
      <Input
        label={<Text>{str.labelLastName}</Text>}
        placeholder="Pulgarín"
      ></Input>
      <Input
        autoComplete="tel"
        label={<Text>{str.labelPhone}</Text>}
        placeholder="3121234567"
      ></Input>
      <Input
        label={<Text>{str.labelIDType}</Text>}
        placeholder="Salomé"
      ></Input>
      <Input label={<Text>{str.labelID}</Text>} placeholder="Salomé"></Input>
    </View>
  );
}
*/