import type { TriageData } from "@/lib/api/interfaces";
import { operatorStatusColors as S } from "@/lib/themes/Colors";
import * as str from "@/lib/strings";
import { scoreTriage, type PriorityLevel } from "@/lib/utils/triagePriority";

export type { PriorityLevel };

type Scheme = { bg: string; border: string; text: string; accent: string };

export interface PriorityInfo {
  level: PriorityLevel;
  label: string;
  color: Scheme;
  score: number;
}

const LABELS: Record<PriorityLevel, string> = {
  CRITICAL: str.operatorTriagePriorityCritical,
  URGENT: str.operatorTriagePriorityUrgent,
  MEDIUM: str.operatorTriagePriorityMild,
};

const COLORS: Record<PriorityLevel, Scheme> = {
  CRITICAL: S.triaged,
  URGENT: S.received,
  MEDIUM: S.closed,
};

export function calcTriagePriority(
  form: { [K in keyof TriageData]: boolean | null } | TriageData,
): PriorityInfo {
  const { level, score } = scoreTriage(form);
  return { level, label: LABELS[level], color: COLORS[level], score };
}
