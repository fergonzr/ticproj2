import { useCallback, useState } from "react";
import type { TriageData } from "@/lib/api/interfaces";
import type { TriageFormData } from "../../components/operator/TriageModal";

const EMPTY: TriageFormData = {
  bleeding: null,
  dizziness: null,
  blurred_vision: null,
  unconscious: null,
  difficulty_breathing: null,
  fracture: null,
  chest_pain: null,
  numbness_limbs: null,
};

export function useTriageForm() {
  const [form, setForm] = useState<TriageFormData>(EMPTY);

  const setField = useCallback((field: keyof TriageData, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => setForm(EMPTY), []);

  const toTriageData = useCallback((): TriageData => {
    const out = {} as TriageData;
    (Object.keys(form) as (keyof TriageData)[]).forEach((k) => {
      out[k] = form[k] === true;
    });
    return out;
  }, [form]);

  const isCritical = useCallback((): boolean => {
    return (Object.values(form) as (boolean | null)[]).some((v) => v === true);
  }, [form]);

  return { form, setField, reset, toTriageData, isCritical };
}
