import type { TriageData } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
import { styles } from "../../styles/operator/TriageModal.styles";
import AppButton from "./AppButton";
import { calcTriagePriority, type PriorityInfo } from "../../hooks/operator/triagePriority";

export type TriageFormData = { [K in keyof TriageData]: boolean | null };

interface Props {
  isOpen: boolean;
  form: TriageFormData;
  onSetField: (field: keyof TriageData, value: boolean) => void;
  onSubmit: (priority: PriorityInfo) => void;
  onCancel: () => void;
}

const QUESTIONS: { field: keyof TriageData; label: string }[] = [
  { field: "unconscious",          label: str.triageQ_unconscious },
  { field: "chest_pain",           label: str.triageQ_chest_pain },
  { field: "difficulty_breathing", label: str.triageQ_difficulty_breathing },
  { field: "bleeding",             label: str.triageQ_bleeding },
  { field: "fracture",             label: str.triageQ_fracture },
  { field: "numbness_limbs",       label: str.triageQ_numbness_limbs },
  { field: "dizziness",            label: str.triageQ_dizziness },
  { field: "blurred_vision",       label: str.triageQ_blurred_vision },
];

export default function TriageModal({ isOpen, form, onSetField, onSubmit, onCancel }: Props) {
  if (!isOpen) return null;

  const allAnswered = QUESTIONS.every((q) => form[q.field] !== null);
  const priority = allAnswered ? calcTriagePriority(form) : null;

  function handleSubmit() {
    if (!priority) return;
    onSubmit(priority);
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
                  const selectedStyle = selected
                    ? val
                      ? styles.optionYesSelected
                      : styles.optionNoSelected
                    : {};
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      style={{ ...styles.optionBtn, ...selectedStyle }}
                      onClick={() => onSetField(field, val)}
                    >
                      {val ? "Sí" : "No"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {priority && (
          <div
            style={{
              ...styles.preview,
              background: priority.color.bg,
              border: `1.5px solid ${priority.color.border}`,
            }}
          >
            <span style={{ ...styles.previewLabel, color: priority.color.text }}>
              {str.operatorTriageResultPrefix}: {priority.label}
            </span>
            <span style={{ ...styles.previewLevel, color: priority.color.text }}>
              ({priority.level})
            </span>
          </div>
        )}

        <div style={styles.footer}>
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton
            title={str.operatorSendTriage}
            onPress={handleSubmit}
            disabled={!allAnswered}
          />
        </div>
      </div>
    </div>
  );
}
