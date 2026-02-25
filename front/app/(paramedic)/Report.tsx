import { ReactElement } from "react";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "@/lib/styles/Report.styles";
import * as str from "@/lib/strings";
import DropPickerDown from "@/lib/components/DropPickerDown";
import RadioOption from "@/lib/components/RadioOption";
import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
/**
 * Screen to allow a Paramedic to fill a report of an emergency.
 *
 * @returns ReactElement
 */

// Types 

type BleedingLevel = "Ninguno" | "Leve" | "Moderado" | "Severo";
type PatientStatus = "Ninguno" | "Estable" | "Critico" | "Fallecido";

interface TriageFormData {
  sangrado: BleedingLevel;
  contusion: boolean | null;
  fractura: boolean | null;
  inconsciente: boolean | null;
  tratamiento: string;
  estadoPaciente: PatientStatus;
}

interface MedicalData {
  nombre: string;
  apellidos: string;
  edad: string;
  alergias: { rinitis: boolean; asma: boolean; dermatitis: boolean };
  enfermedades: string;
  marcaPasos: boolean | null;
  tipoSangre: string;
}

// Medical Constants

const BLEEDING_LEVELS: BleedingLevel[] = ["Ninguno", "Leve", "Moderado", "Severo"];
const PATIENT_STATUSES: PatientStatus[] = ["Ninguno", "Estable", "Critico", "Fallecido"];

const INITIAL_FORM: TriageFormData = {
  sangrado: "Ninguno",
  contusion: null,
  fractura: null,
  inconsciente: null,
  tratamiento: "",
  estadoPaciente: "Ninguno",
};


// Sub-component

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}


export default function Report(): ReactElement {

  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [form, setForm] = useState<TriageFormData>(INITIAL_FORM);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = await AsyncStorage.getItem("medicalData");
        if (raw) setMedicalData(JSON.parse(raw));
      } catch {
        // no data saved yet
      }
    };
    loadData();
  }, []);

  const set = (field: keyof TriageFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const formatAllergies = (a?: MedicalData["alergias"]) => {
    if (!a) return "—";
    const list = [];
    if (a.rinitis) list.push("Rinitis");
    if (a.asma) list.push("Asma");
    if (a.dermatitis) list.push("Dermatitis");
    return list.length ? list.join(", ") : "Ninguna";
  };

  const handleSend = async () => {
    if (form.contusion === null || form.fractura === null || form.inconsciente === null) {
      Alert.alert(str.alertError, str.alertTriageMissingFields);
      console.log("Medical evaluation incomplete");
      return;
    }
    try {
      const report = {
        ...form,
        paciente: medicalData,
        fecha: new Date().toISOString(),
      };
      await AsyncStorage.setItem("lastReport", JSON.stringify(report));
      Alert.alert(str.alertSuccess, str.alertReportSuccess);
      console.log("Medical evaluation complete");
    } catch {
      Alert.alert(str.alertError, str.alertReportError);
      console.log("Medical evaluation error");
    }
  };

  const handleCancel = () => setForm(INITIAL_FORM);


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.avatarIcon}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillButton}>
          <Text style={styles.pillButtonText}>Paramedico</Text>
        </TouchableOpacity>
      </View>

      {/* Register */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{str.sectionRecord}</Text>
        <InfoRow
          label="Nombre"
          value={
            medicalData
              ? `${medicalData.nombre} ${medicalData.apellidos}`
              : "—"
          }
        />
        <InfoRow
          label={str.labelAge}
          value={medicalData ? `${medicalData.edad} años` : "—"}
        />
        <InfoRow label={str.labelAllergies} value={formatAllergies(medicalData?.alergias)} />
        <InfoRow label={str.labelDiseases} value={medicalData?.enfermedades ?? "—"} />
        <InfoRow
          label={str.labelPacemaker}
          value={
            medicalData?.marcaPasos === true
              ? "Si"
              : medicalData?.marcaPasos === false
              ? "No"
              : "—"
          }
        />
        <InfoRow label={str.labelBloodType} value={medicalData?.tipoSangre ?? "—"} />
      </View>

      {/* Evaluation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{str.sectionTriage}</Text>

        {/* bleeding */}
        <View style={styles.triageRow}>
          <Text style={styles.triageLabel}>{str.labelBleeding}:</Text>
          <DropPickerDown
            options={BLEEDING_LEVELS}
            selected={form.sangrado}
            onSelect={(v) => set("sangrado", v as BleedingLevel)}
          />
        </View>

        {/* Contusion */}
        <View style={styles.triageRow}>
          <Text style={styles.triageLabel}>{str.labelContusion}:</Text>
          <View style={styles.radioRow}>
            <RadioOption
              label={str.optionYes}
              selected={form.contusion === true}
              onPress={() => set("contusion", true)}
            />
            <RadioOption
              label={str.optionNo}
              selected={form.contusion === false}
              onPress={() => set("contusion", false)}
            />
          </View>
        </View>

        {/* fracture */}
        <View style={styles.triageRow}>
          <Text style={styles.triageLabel}>{str.labelFracture}:</Text>
          <View style={styles.radioRow}>
            <RadioOption
              label={str.optionYes}
              selected={form.fractura === true}
              onPress={() => set("fractura", true)}
            />
            <RadioOption
              label={str.optionNo}
              selected={form.fractura === false}
              onPress={() => set("fractura", false)}
            />
          </View>
        </View>

        {/* unconscious */}
        <View style={styles.triageRow}>
          <Text style={styles.triageLabel}>{str.labelUnconscious}:</Text>
          <View style={styles.radioRow}>
            <RadioOption
              label={str.optionYes}
              selected={form.inconsciente === true}
              onPress={() => set("inconsciente", true)}
            />
            <RadioOption
              label={str.optionNo}
              selected={form.inconsciente === false}
              onPress={() => set("inconsciente", false)}
            />
          </View>
        </View>

        {/* Treatment */}
        <Text style={styles.treatmentLabel}>{str.labelTreatment}</Text>
        <TextInput
          style={styles.treatmentInput}
          value={form.tratamiento}
          onChangeText={(v) => set("tratamiento", v)}
          multiline
          textAlignVertical="top"
          placeholder={str.placeholderTreatment}
        />

        {/* Patient's condition*/}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{str.labelPatientStatus}</Text>
          <DropPickerDown
            options={PATIENT_STATUSES}
            selected={form.estadoPaciente}
            onSelect={(v) => set("estadoPaciente", v as PatientStatus)}
          />
        </View>
      </View>
      {/* TODO: Remove test button */}
      <Button onPress={() => router.push("/LoginScreen")}>
        [TEST] back to login
      </Button>


      {/* buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
          <Text style={styles.actionButtonText}>{str.btnCancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
          <Text style={styles.actionButtonText}>{str.btnSend}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

}
