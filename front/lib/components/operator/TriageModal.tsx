import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { TriageFormData } from "@/lib/models";
import { styles } from "@/lib/styles/operator/TriageModal.styles";
import * as str from "@/lib/strings";
import AppButton from "@/lib/components/AppButton";

interface Props {
  isOpen: boolean;
  emergencyId: string;
  form: TriageFormData;
  onSetField: (field: keyof TriageFormData, value: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const QUESTIONS: { field: keyof TriageFormData; label: string }[] = [
  { field: "dizziness",            label: str.triageQ_dizziness },
  { field: "bleeding",             label: str.triageQ_bleeding },
  { field: "blurred_vision",       label: str.triageQ_blurred_vision },
  { field: "unconscious",          label: str.triageQ_unconscious },
  { field: "difficulty_breathing", label: str.triageQ_difficulty_breathing },
  { field: "fracture",             label: str.triageQ_fracture },
  { field: "chest_pain",           label: str.triageQ_chest_pain },
  { field: "numbness_limbs",       label: str.triageQ_numbness_limbs },
];

export default function TriageModal({
  isOpen,
  form,
  onSetField,
  onSubmit,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  const isComplete = Object.values(form).every((v) => v !== null);

  function handleSubmit() {
    if (!isComplete) {
      Alert.alert(str.alertError, str.operatorTriageIncomplete);
      return;
    }
    onSubmit();
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>{str.operatorTriageTitle}</Text>
        <ScrollView>
          {QUESTIONS.map(({ field, label }) => (
            <View key={field} style={styles.questionRow}>
              <Text style={styles.questionText}>{label}</Text>
              <View style={styles.yesNo}>
                {([true, false] as const).map((val) => {
                  const selected = form[field] === val;
                  return (
                    <TouchableOpacity
                      key={String(val)}
                      style={[styles.optionBtn, selected && styles.optionSelected]}
                      onPress={() => onSetField(field, val)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selected && styles.optionTextSelected,
                        ]}
                      >
                        {val ? "Sí" : "No"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <AppButton title="Cancelar" onPress={onCancel} variant="outline" />
          <AppButton title={str.operatorSendTriage} onPress={handleSubmit} />
        </View>
      </View>
    </View>
  );
}
