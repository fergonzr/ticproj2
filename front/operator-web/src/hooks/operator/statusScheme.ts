import { operatorStatusColors as S } from "@/lib/themes/Colors";
import * as str from "@/lib/strings";

export type Scheme = { bg: string; border: string; text: string; accent: string };

export interface StatusInfo {
  label: string;
  scheme: Scheme;
}

export function statusInfo(state: string): StatusInfo {
  switch (state) {
    case "RECEIVED":    return { label: str.operatorStateReceived, scheme: S.received };
    case "TRIAGED":     return { label: "Triajada",                scheme: S.triaged };
    case "ASSIGNED":    return { label: str.operatorStateAssigned, scheme: S.assigned };
    case "ON_SITE":     return { label: str.operatorStateOnsite,   scheme: S.onSite };
    case "IN_TRANSFER": return { label: "Traslado",                scheme: S.onSite };
    case "CLOSED":      return { label: "Cerrada",                 scheme: S.closed };
    case "CANCELED":    return { label: "Cancelada",               scheme: S.closed };
    default:            return { label: state,                     scheme: S.received };
  }
}

export function minutesSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 60000));
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}
