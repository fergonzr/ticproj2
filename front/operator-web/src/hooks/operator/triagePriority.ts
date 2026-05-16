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

/** Maps the paramedic's complexity scale (0/1/2) onto the same severity
 *  levels used for the operator's triage, so a single chip in the UI can
 *  carry either reading without inventing a parallel color palette. */
function complexityToLevel(level: number): PriorityLevel {
  if (level >= 2) return "CRITICAL";
  if (level >= 1) return "URGENT";
  return "MEDIUM";
}

export function calcTriagePriority(
  form: { [K in keyof TriageData]: boolean | null } | TriageData,
): PriorityInfo {
  const { level, score } = scoreTriage(form);
  return { level, label: LABELS[level], color: COLORS[level], score };
}

/** Source of the criticality reading shown in the UI. The paramedic's
 *  on-site retriage takes precedence over the operator's initial triage,
 *  since it is both more current and made with a physical examination. */
export type CriticalitySource = "operator" | "paramedic";

export interface CriticalityDisplay {
  label: string;
  color: Scheme;
  source: CriticalitySource;
  /** Localized one-liner describing where the reading comes from
   *  (e.g. "Triaje inicial del operador"). */
  sourceLabel: string;
}

/**
 * Resolves the current criticality reading for an emergency. When the
 * paramedic has assigned a complexity level, that becomes the displayed
 * triage (overriding the operator's initial reading); otherwise the
 * operator's 8-symptom triage is used. Returns `null` when neither
 * reading is available so the caller can hide the chip.
 */
export function getCurrentCriticality(
  triage: TriageData | null,
  complexityLevel: number | null | undefined,
): CriticalityDisplay | null {
  // Both branches surface the raw PriorityLevel name (CRITICAL / URGENT /
  // MEDIUM) instead of a localized label, matching how the back-end stores
  // the reading and keeping the vocabulary consistent across sources.
  if (complexityLevel != null) {
    const level = complexityToLevel(complexityLevel);
    return {
      label: level,
      color: COLORS[level],
      source: "paramedic",
      sourceLabel: str.criticalitySourceParamedic,
    };
  }
  if (triage) {
    const info = calcTriagePriority(triage);
    return {
      label: info.level,
      color: info.color,
      source: "operator",
      sourceLabel: str.criticalitySourceOperator,
    };
  }
  return null;
}
