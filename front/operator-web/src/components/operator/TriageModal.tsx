import type { TriageData } from "@/lib/api/interfaces";
import * as str from "@/lib/strings";
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] backdrop-blur-[2px]" onClick={onCancel}>
      <div className="w-[460px] max-w-[92vw] bg-op-surface rounded-[14px] p-7 max-h-[80%] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,.2)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[18px] font-bold text-op-text m-0 mb-5">{str.operatorTriageTitle}</h2>
        <div className="flex-1 overflow-y-auto mb-5">
          {QUESTIONS.map(({ field, label }) => (
            <div key={field} className="flex items-center justify-between py-[10px] border-b border-op-border-light">
              <span className="text-[13px] text-op-text flex-1 mr-3">{label}</span>
              <div className="flex gap-1">
                {([true, false] as const).map((val) => {
                  const selected = form[field] === val;
                  const selectedCls = selected
                    ? "[border:1.5px_solid_#ef4444] bg-red-50 text-op-error"
                    : "";
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      className={`px-[14px] py-1 rounded-[6px] text-[12px] font-semibold cursor-pointer [border:1.5px_solid_#e5e7eb] bg-op-surface text-op-text-sec font-[inherit] transition-all hover:[border:1.5px_solid_#9ca3af] hover:bg-gray-50 ${selectedCls}`}
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
            className="px-[14px] py-[10px] rounded-[8px] mb-4 flex items-center gap-[10px]"
            style={{ background: priority.color.bg, border: `1.5px solid ${priority.color.border}` }}
          >
            <span className="text-[13px] font-bold" style={{ color: priority.color.text }}>
              {str.operatorTriageResultPrefix}: {priority.label}
            </span>
            <span className="text-[11px] opacity-70" style={{ color: priority.color.text }}>
              ({priority.level})
            </span>
          </div>
        )}

        <div className="flex gap-[10px] justify-end">
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title={str.operatorSendTriage} onPress={handleSubmit} disabled={!allAnswered} />
        </div>
      </div>
    </div>
  );
}
