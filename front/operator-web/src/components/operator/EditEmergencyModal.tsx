import * as str from "@/lib/strings";
import { DOCUMENT_TYPES, BLOOD_TYPES } from "@/lib/models";
import AppButton from "./AppButton";
import type { EmergencyEditor } from "../../hooks/operator/useEmergencyEditor";

interface Props {
  isOpen: boolean;
  editor: EmergencyEditor;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Free-text medical fields, in display order. Every key is both a
 *  `MedicalField` and a `keyof EmergencyEditorForm` whose value is a string. */
const TEXT_FIELDS: {
  key:
    | "firstName"
    | "lastName"
    | "phone"
    | "documentNumber"
    | "age"
    | "allergies"
    | "diseases";
  label: string;
  placeholder: string;
}[] = [
  { key: "firstName", label: str.editLabel_firstName, placeholder: str.editPlaceholder_firstName },
  { key: "lastName", label: str.editLabel_lastName, placeholder: str.editPlaceholder_lastName },
  { key: "phone", label: str.editLabel_phone, placeholder: str.editPlaceholder_phone },
  { key: "documentNumber", label: str.editLabel_documentNumber, placeholder: str.editPlaceholder_documentNumber },
  { key: "age", label: str.editLabel_age, placeholder: str.editPlaceholder_age },
  { key: "allergies", label: str.editLabel_allergies, placeholder: str.editPlaceholder_allergies },
  { key: "diseases", label: str.editLabel_diseases, placeholder: str.editPlaceholder_diseases },
];

function inputClass(locked: boolean): string {
  return (
    "w-full border border-op-border rounded-[6px] px-2 py-2 text-[13px] " +
    "text-op-text mb-1 box-border outline-none " +
    (locked ? "bg-op-bg text-op-text-ter cursor-not-allowed" : "bg-white")
  );
}

const labelClass =
  "block text-[11px] font-bold text-[#616161] tracking-[0.6px] uppercase mb-1";
const sectionClass =
  "text-[11px] font-bold text-op-text-ter tracking-[0.6px] uppercase mb-3 mt-5";
const hintClass = "text-[10px] text-op-text-ter italic";
const errorClass = "block text-[11px] text-op-error mt-1";

export default function EditEmergencyModal({
  isOpen,
  editor,
  onSubmit,
  onCancel,
}: Props) {
  if (!isOpen) return null;
  const { form, setField, isLocked, errors, geocodingState, addressResults } =
    editor;

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]"
      onClick={onCancel}
    >
      <div
        className="w-[460px] max-w-[90vw] max-h-[88vh] overflow-y-auto bg-white rounded-[12px] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-bold text-op-text mb-2 mt-0">
          {str.operatorEditTitle}
        </h2>

        <h3 className={sectionClass}>{str.editSectionMedical}</h3>

        {TEXT_FIELDS.map(({ key, label, placeholder }) => {
          const locked = isLocked(key);
          return (
            <div key={key} className="mb-3">
              <label className={labelClass}>{label}</label>
              <input
                type="text"
                className={inputClass(locked)}
                value={form[key]}
                disabled={locked}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={placeholder}
              />
              {locked && <span className={hintClass}>{str.editLockedHint}</span>}
            </div>
          );
        })}

        <div className="mb-3">
          <label className={labelClass}>{str.editLabel_documentType}</label>
          <select
            className={inputClass(isLocked("documentType"))}
            value={form.documentType}
            disabled={isLocked("documentType")}
            onChange={(e) => setField("documentType", e.target.value)}
          >
            {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {isLocked("documentType") && (
            <span className={hintClass}>{str.editLockedHint}</span>
          )}
        </div>

        <div className="mb-3">
          <label className={labelClass}>{str.editLabel_bloodType}</label>
          <select
            className={inputClass(isLocked("bloodType"))}
            value={form.bloodType}
            disabled={isLocked("bloodType")}
            onChange={(e) => setField("bloodType", e.target.value)}
          >
            <option value="">{str.editBloodTypePlaceholder}</option>
            {Object.entries(BLOOD_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {isLocked("bloodType") && (
            <span className={hintClass}>{str.editLockedHint}</span>
          )}
          {errors.bloodType && (
            <span className={errorClass}>{errors.bloodType}</span>
          )}
        </div>

        <label className="flex items-center gap-2 mb-1 text-[13px] text-op-text">
          <input
            type="checkbox"
            checked={form.hasPacemaker}
            disabled={isLocked("hasPacemaker")}
            onChange={(e) => setField("hasPacemaker", e.target.checked)}
          />
          {str.editLabel_hasPacemaker}
        </label>

        <h3 className={sectionClass}>{str.editSectionLocation}</h3>
        <label className={labelClass}>{str.editLabel_address}</label>
        <div className="flex gap-2 mb-1">
          <input
            type="text"
            className="flex-1 border border-op-border rounded-[6px] px-2 py-2 text-[13px] text-op-text bg-white box-border outline-none"
            value={form.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder={str.editPlaceholder_address}
          />
          <AppButton
            title={str.editSearchAddress}
            onPress={editor.searchAddress}
            variant="outline"
          />
        </div>
        {geocodingState === "searching" && (
          <span className="text-[11px] text-op-text-ter">
            {str.editGeocodingSearching}
          </span>
        )}
        {geocodingState === "error" && (
          <span className="text-[11px] text-op-error">
            {str.editGeocodingError}
          </span>
        )}
        {geocodingState === "empty" && (
          <span className="text-[11px] text-op-error">
            {str.editGeocodingEmpty}
          </span>
        )}
        {errors.address && <span className={errorClass}>{errors.address}</span>}

        {addressResults.length > 0 && (
          <ul className="list-none p-0 mt-2 mb-2 border border-op-border rounded-[6px] max-h-[140px] overflow-y-auto">
            {addressResults.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full text-left px-2 py-2 text-[12px] text-op-text bg-white hover:bg-op-bg border-0 border-b border-op-border cursor-pointer"
                  onClick={() => editor.pickAddressResult(r)}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-row justify-end mt-6 gap-4">
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title={str.editSave} onPress={onSubmit} />
        </div>
      </div>
    </div>
  );
}
