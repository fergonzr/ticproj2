import type { TriageData } from "@/lib/api/interfaces";
import { operatorStatusColors as S } from "@/lib/themes/Colors";
import * as str from "@/lib/strings";

export type PriorityLevel = "CRITICAL" | "URGENT" | "MEDIUM";

type Scheme = { bg: string; border: string; text: string; accent: string };

export interface PriorityInfo {
  level: PriorityLevel;
  label: string;
  color: Scheme;
  score: number;
}

const WEIGHTS: Record<keyof TriageData, number> = {
  unconscious: 5,
  chest_pain: 5,
  difficulty_breathing: 4,
  bleeding: 3,
  fracture: 3,
  numbness_limbs: 2,
  dizziness: 1,
  blurred_vision: 1,
};

const THRESHOLD_CRITICAL = 5;
const THRESHOLD_URGENT = 3;

export function calcTriagePriority(
  form: { [K in keyof TriageData]: boolean | null } | TriageData,
): PriorityInfo {
  let score = 0;
  (Object.keys(WEIGHTS) as (keyof TriageData)[]).forEach((k) => {
    if (form[k] === true) score += WEIGHTS[k];
  });
  if (score >= THRESHOLD_CRITICAL) {
    return { level: "CRITICAL", label: str.operatorTriagePriorityCritical, color: S.triaged, score };
  }
  if (score >= THRESHOLD_URGENT) {
    return { level: "URGENT", label: str.operatorTriagePriorityUrgent, color: S.received, score };
  }
  return { level: "MEDIUM", label: str.operatorTriagePriorityMild, color: S.closed, score };
}
