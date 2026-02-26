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
import { useRouter, useLocalSearchParams } from "expo-router";
import styles from "@/lib/styles/Report.styles";
import * as str from "@/lib/strings";
import DropdownPicker from "@/lib/components/DropdownPicker";
import RadioOption from "@/lib/components/RadioOption";
import { useApi } from "@/lib/api/useApi";
import {
  BleedingLevel,
  CaseReport,
  EmergencyCase,
  MedicalInfo,
  PatientStatus,
} from "@/lib/models";
import { Button } from "@react-navigation/elements";

/**
 * Screen to allow a Paramedic to fill a report of an emergency.
 *
 * @returns ReactElement
 */

// Constants 

const BLEEDING_LEVELS: BleedingLevel[] = ["Ninguno", "Leve", "Moderado", "Severo"];
const PATIENT_STATUSES: PatientStatus[] = ["Ninguno", "Estable", "Critico", "Fallecido"];

type TriageForm = Omit<CaseReport, "emergencyCase" | "submittedOn">;

const EMPTY_TRIAGE: TriageForm = {
  sangrado: "Ninguno",
  contusion: false,
  fractura: false,
  inconsciente: false,
  tratamiento: "",
  estadoPaciente: "Ninguno",
};

// Sub-components

function InfoRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Helpers

function formatAlergias(alergias?: MedicalInfo["alergias"]): string {
  if (!alergias) return "—";
  const list = [];
  if (alergias.rinitis) list.push("Rinitis");
  if (alergias.asma) list.push("Asma");
  if (alergias.dermatitis) list.push("Dermatitis");
  return list.length ? list.join(", ") : "Ninguna";
}

function formatMarcaPasos(value?: boolean | null): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "—";
}

export default function Report(): ReactElement {

  const router = useRouter();
  const params = useLocalSearchParams<{ emergencyCase: string }>();
  const { caseReportSubmitter } = useApi();

  const [emergencyCase, setEmergencyCase] = useState<EmergencyCase | null>(null);
  const [form, setForm] = useState<TriageForm>(EMPTY_TRIAGE);
  const [submitting, setSubmitting] = useState(false);

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

  const set = <K extends keyof TriageForm>(field: K, value: TriageForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSend = async () => {
    if (!emergencyCase) {
      Alert.alert(str.alertError, "No hay un caso de emergencia asociado.");
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
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.avatarIcon}>👤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillButton}>
          <Text style={styles.pillButtonText}>Paramedico</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Registro — autocompleted from EmergencyCase */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{str.sectionRecord}</Text>
        <InfoRow
          label="Nombre"
          value={medical ? `${medical.nombre} ${medical.apellidos}` : "—"}
        />
        <InfoRow label={str.labelAge} value={medical ? `${medical.edad} años` : "—"} />
        <InfoRow label={str.labelAllergies} value={formatAlergias(medical?.alergias)} />
        <InfoRow label={str.labelDiseases} value={medical?.enfermedades ?? "—"} />
        <InfoRow label={str.labelPacemaker} value={formatMarcaPasos(medical?.marcaPasos)} />
        <InfoRow label={str.labelBloodType} value={medical?.tipoSangre ?? "—"} />
      </View>

      {/* Triaje */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{str.sectionTriage}</Text>

        {/* Sangrado */}
        <View style={styles.triageRow}>
          <Text style={styles.triageLabel}>{str.labelBleeding}:</Text>
          <DropdownPicker
            options={BLEEDING_LEVELS}
            selected={form.sangrado}
            onSelect={(v) => set("sangrado", v as BleedingLevel)}
          />
        </View>

        {/* Contusión */}
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

        {/* Fractura */}
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

        {/* Inconsciente */}
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

        {/* Tratamiento */}
        <Text style={styles.treatmentLabel}>{str.labelTreatment}</Text>
        <TextInput
          style={styles.treatmentInput}
          value={form.tratamiento}
          onChangeText={(v) => set("tratamiento", v)}
          multiline
          textAlignVertical="top"
          placeholder={str.placeholderTreatment}
        />

        {/* Estado del paciente */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{str.labelPatientStatus}</Text>
          <DropdownPicker
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

      {/* Botones */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
          <Text style={styles.actionButtonText}>{str.btnCancel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, submitting && styles.actionButtonDisabled]}
          onPress={handleSend}
          disabled={submitting}
        >
          <Text style={styles.actionButtonText}>
            {submitting ? "Enviando..." : str.btnSend}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
