import * as str from "@/lib/strings";
import { styles } from "../../styles/operator/EditEmergencyModal.styles";
import AppButton from "./AppButton";

export interface EditEmergencyFormData {
  fullName: string;
  estimatedAge: string;
  knownConditions: string;
  observations: string;
}

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
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{str.operatorEditTitle}</h2>
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={styles.label}>{label}</label>
            <input
              type="text"
              style={styles.input}
              value={form[key]}
              onChange={(e) => onSetField(key, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
        <div style={styles.footer}>
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title="Guardar" onPress={onSubmit} />
        </div>
      </div>
    </div>
  );
}
