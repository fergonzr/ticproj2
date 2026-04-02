import { View, Text, TextInput } from "react-native";
import { EditEmergencyFormData } from "@/lib/models";
import { styles } from "@/lib/styles/operator/EditEmergencyModal.styles";
import { colors } from "@/lib/themes/Colors";
import * as str from "@/lib/strings";
import AppButton from "@/lib/components/AppButton";

interface Props {
  isOpen: boolean;
  form: EditEmergencyFormData;
  onSetField: (field: keyof EditEmergencyFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function EditEmergencyModal({
  isOpen,
  form,
  onSetField,
  onSubmit,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  const fields: {
    key: keyof EditEmergencyFormData;
    label: string;
    placeholder: string;
  }[] = [
    { key: "fullName",        label: str.editLabel_fullName,        placeholder: str.editPlaceholder_fullName },
    { key: "estimatedAge",    label: str.editLabel_estimatedAge,    placeholder: str.editPlaceholder_estimatedAge },
    { key: "knownConditions", label: str.editLabel_knownConditions, placeholder: str.editPlaceholder_knownConditions },
    { key: "observations",    label: str.editLabel_observations,    placeholder: str.editPlaceholder_observations },
  ];

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>{str.operatorEditTitle}</Text>
        {fields.map(({ key, label, placeholder }) => (
          <View key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key]}
              onChangeText={(v) => onSetField(key, v)}
              placeholder={placeholder}
              placeholderTextColor={colors.placeholder}
            />
          </View>
        ))}
        <View style={styles.footer}>
          <AppButton title="Cancelar" onPress={onCancel} variant="outline" />
          <AppButton title="Guardar" onPress={onSubmit} />
        </View>
      </View>
    </View>
  );
}
