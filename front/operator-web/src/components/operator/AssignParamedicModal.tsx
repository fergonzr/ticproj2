import { useState } from "react";
import * as str from "@/lib/strings";
import AppButton from "./AppButton";

export interface ParamedicOption {
  id: string;
  name: string;
}

// Known test paramedics from users.yaml — replace with an API call once
// the paramedic recommendation service is integrated.
const KNOWN_PARAMEDICS: ParamedicOption[] = [
  { id: "77e22242-8aaf-488d-b4ec-256a43bb67b0", name: "Javier Peláez" },
];

interface Props {
  isOpen: boolean;
  onAssign: (paramedicId: string) => void;
  onCancel: () => void;
}

export default function AssignParamedicModal({ isOpen, onAssign, onCancel }: Props) {
  const [selectedId, setSelectedId] = useState(KNOWN_PARAMEDICS[0]?.id ?? "");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]"
      onClick={onCancel}
    >
      <div
        className="w-[400px] max-w-[90vw] bg-white rounded-[12px] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-bold text-op-text mb-6 mt-0">
          {str.operatorAssignTitle}
        </h2>

        <label className="block text-[11px] font-bold text-[#616161] tracking-[0.6px] uppercase mb-1">
          {str.operatorParamedicIdLabel}
        </label>
        <select
          className="w-full border border-op-border rounded-[6px] px-2 py-2 text-[13px] text-op-text mb-6 bg-white"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {KNOWN_PARAMEDICS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="flex flex-row justify-end gap-4">
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton
            title={str.btnAssign}
            onPress={() => selectedId && onAssign(selectedId)}
          />
        </div>
      </div>
    </div>
  );
}
