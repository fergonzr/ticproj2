import type { ReactNode } from "react";

export type PillVariant =
  | "critical" | "urgent" | "light"
  | "stable"   | "cancelled" | "onsite" | "delivered";

const VARIANT: Record<PillVariant, string> = {
  critical:  "bg-red-100 text-red-700",
  urgent:    "bg-orange-100 text-orange-700",
  light:     "bg-emerald-100 text-emerald-700",
  stable:    "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-200 text-gray-600",
  onsite:    "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

interface Props {
  variant: PillVariant;
  children: ReactNode;
}

export default function Pill({ variant, children }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-[3px] rounded-full text-[10px] font-bold uppercase tracking-wide ${VARIANT[variant]}`}>
      {children}
    </span>
  );
}
