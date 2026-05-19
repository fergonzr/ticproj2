import { TriageData, ComplexityLevel } from "@/lib/models";
import * as str from "@/lib/strings";

/**
 * Triage priority derived from the operator's symptom checklist.
 * The backend stores only the raw symptoms; the level is computed client-side
 * so the operator dashboard and the paramedic app always agree.
 */
export type PriorityLevel = "CRITICAL" | "URGENT" | "MEDIUM";

/** Tone vocabulary shared with the `Chip` component. */
export type CriticalityTone = "critical" | "urgent" | "mild" | "neutral";

const TRIAGE_WEIGHTS: Record<keyof TriageData, number> = {
  unconscious: 5,
  chest_pain: 5,
  bleeding: 5,
  difficulty_breathing: 4,
  fracture: 3,
  numbness_limbs: 2,
  dizziness: 1,
  blurred_vision: 1,
};

const THRESHOLD_CRITICAL = 7;
const THRESHOLD_URGENT = 5;

type TriageInput = { [K in keyof TriageData]?: boolean | null };

/** Scores a triage symptom set into a priority level. */
export function scoreTriage(triage: TriageInput): {
  level: PriorityLevel;
  score: number;
} {
  let score = 0;
  (Object.keys(TRIAGE_WEIGHTS) as (keyof TriageData)[]).forEach((k) => {
    if (triage[k] === true) score += TRIAGE_WEIGHTS[k];
  });
  if (score >= THRESHOLD_CRITICAL) return { level: "CRITICAL", score };
  if (score >= THRESHOLD_URGENT) return { level: "URGENT", score };
  return { level: "MEDIUM", score };
}

export interface CriticalityDisplay {
  label: string;
  tone: CriticalityTone;
  /** Whether the value reflects the paramedic's retriage or the operator's triage. */
  source: "paramedic" | "operator" | "none";
}

/**
 * Resolves the criticality to display for an emergency.
 * The paramedic's complexity assignment (the "retriage") overrides the
 * operator's initial triage; when neither is set the result is unknown.
 */
export function getEmergencyCriticality(emergency: {
  triage?: TriageData | null;
  complexityLevel?: ComplexityLevel | null;
}): CriticalityDisplay {
  if (emergency.complexityLevel != null) {
    switch (emergency.complexityLevel) {
      case ComplexityLevel.HIGH:
        return { label: str.complexityHigh, tone: "critical", source: "paramedic" };
      case ComplexityLevel.INTERMEDIATE:
        return { label: str.complexityIntermediate, tone: "urgent", source: "paramedic" };
      case ComplexityLevel.BASIC:
        return { label: str.complexityBasic, tone: "mild", source: "paramedic" };
    }
  }
  if (emergency.triage) {
    const { level } = scoreTriage(emergency.triage);
    if (level === "CRITICAL")
      return { label: str.operatorTriagePriorityCritical, tone: "critical", source: "operator" };
    if (level === "URGENT")
      return { label: str.operatorTriagePriorityUrgent, tone: "urgent", source: "operator" };
    return { label: str.operatorTriagePriorityMild, tone: "mild", source: "operator" };
  }
  return { label: str.criticalityUnknown, tone: "neutral", source: "none" };
}
