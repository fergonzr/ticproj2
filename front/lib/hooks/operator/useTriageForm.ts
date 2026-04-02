import { useState } from "react";
import { TriageFormData } from "@/lib/models";

function emptyForm(): TriageFormData {
  return {
    dizziness: null,
    bleeding: null,
    blurred_vision: null,
    unconscious: null,
    difficulty_breathing: null,
    fracture: null,
    chest_pain: null,
    numbness_limbs: null,
  };
}

export function useTriageForm() {
  const [form, setForm] = useState<TriageFormData>(emptyForm());

  function setField<K extends keyof TriageFormData>(field: K, value: boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function reset() {
    setForm(emptyForm());
  }

  function isComplete(): boolean {
    return Object.values(form).every((v) => v !== null);
  }

  function toPayload(emergencyId: string): {
    emergencyId: string;
    triage: Required<{ [K in keyof TriageFormData]: boolean }>;
  } {
    if (!isComplete()) throw new Error("Triage form is incomplete");
    return {
      emergencyId,
      triage: form as Required<{ [K in keyof TriageFormData]: boolean }>,
    };
  }

  return { form, setField, reset, isComplete, toPayload };
}
