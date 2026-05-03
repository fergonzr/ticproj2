import * as str from "@/lib/strings";
import AppButton from "./AppButton";

export interface EditEmergencyFormData {
  fullName: string;
  estimatedAge: string;
  knownConditions: string;
  observations: string;
}

interface Props {
  isOpen: boolean;
  form: EditEmergencyFormData;
  onSetField: (field: keyof EditEmergencyFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function EditEmergencyModal({
  isOpen,
  form,
  onSetField,
  onSubmit,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  const fields: {
    key: keyof EditEmergencyFormData;
    label: string;
    placeholder: string;
  }[] = [
    { key: "fullName",        label: str.editLabel_fullName,        placeholder: str.editPlaceholder_fullName },
    { key: "estimatedAge",    label: str.editLabel_estimatedAge,    placeholder: str.editPlaceholder_estimatedAge },
    { key: "knownConditions", label: str.editLabel_knownConditions, placeholder: str.editPlaceholder_knownConditions },
    { key: "observations",    label: str.editLabel_observations,    placeholder: str.editPlaceholder_observations },
  ];

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]" onClick={onCancel}>
      <div className="w-[440px] max-w-[90vw] bg-white rounded-[12px] p-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[16px] font-bold text-op-text mb-6 mt-0">{str.operatorEditTitle}</h2>
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-[11px] font-bold text-[#616161] tracking-[0.6px] uppercase mb-1">{label}</label>
            <input
              type="text"
              className="w-full border border-op-border rounded-[6px] px-2 py-2 text-[13px] text-op-text mb-4 bg-white box-border outline-none"
              value={form[key]}
              onChange={(e) => onSetField(key, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
        <div className="flex flex-row justify-end mt-2 gap-4">
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title="Guardar" onPress={onSubmit} />
        </div>
      </div>
    </div>
  );
}
