import type { TriageData } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import { styles } from "../../styles/operator/TriageModal.styles";
import AppButton from "./AppButton";

export type TriageFormData = { [K in keyof TriageData]: boolean | null };

interface Props {
  isOpen: boolean;
  form: TriageFormData;
  onSetField: (field: keyof TriageData, value: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const QUESTIONS: { field: keyof TriageData; label: string }[] = [
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
      alert(`${str.alertError}: ${str.operatorTriageIncomplete}`);
      return;
    }
    onSubmit();
  }

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{str.operatorTriageTitle}</h2>
        <div style={styles.scroll}>
          {QUESTIONS.map(({ field, label }) => (
            <div key={field} style={styles.questionRow}>
              <span style={styles.questionText}>{label}</span>
              <div style={styles.yesNo}>
                {([true, false] as const).map((val) => {
                  const selected = form[field] === val;
                  return (
                    <button
                      key={String(val)}
                      style={{ ...styles.optionBtn, ...(selected ? styles.optionSelected : {}) }}
                      onClick={() => onSetField(field, val)}
                      type="button"
                    >
                      {val ? "Sí" : "No"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={styles.footer}>
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title={str.operatorSendTriage} onPress={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
