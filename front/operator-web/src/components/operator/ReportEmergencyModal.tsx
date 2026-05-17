import * as str from "@/lib/strings";
import { DOCUMENT_TYPES, BLOOD_TYPES } from "@/lib/models";
import AppButton from "./AppButton";
import type { EmergencyReporter } from "../../hooks/operator/useEmergencyReporter";

interface Props {
  isOpen: boolean;
  reporter: EmergencyReporter;
  onSubmit: () => void;
  onCancel: () => void;
}

/** Free-text medical fields, in display order. Every key is a
 *  `keyof EmergencyReporterForm` whose value is a string. */
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

const inputClass =
  "w-full border border-op-border rounded-[6px] px-2 py-2 text-[13px] " +
  "text-op-text mb-1 box-border outline-none bg-white";
const labelClass =
  "block text-[11px] font-bold text-[#616161] tracking-[0.6px] uppercase mb-1";
const sectionClass =
  "text-[11px] font-bold text-op-text-ter tracking-[0.6px] uppercase mb-3 mt-5";
const errorClass = "block text-[11px] text-op-error mt-1";

export default function ReportEmergencyModal({
  isOpen,
  reporter,
  onSubmit,
  onCancel,
}: Props) {
  if (!isOpen) return null;
  const { form, setField, errors, geocodingState, addressResults } = reporter;

  return (
    // No close-on-backdrop-click: a stray click outside must not discard a
    // half-filled report. The modal closes only via Cancelar.
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]">
      <div className="w-[460px] max-w-[90vw] max-h-[88vh] overflow-y-auto bg-white rounded-[12px] p-8">
        <h2 className="text-[16px] font-bold text-op-text mb-2 mt-0">
          {str.operatorReportTitle}
        </h2>

        <h3 className={sectionClass}>{str.editSectionMedical}</h3>

        {TEXT_FIELDS.map(({ key, label, placeholder }) => {
          const isAge = key === "age";
          // Age, phone and document number accept digits only — strip the rest.
          const digitsOnly =
            isAge || key === "documentNumber" || key === "phone";
          return (
            <div key={key} className="mb-3">
              <label className={labelClass}>{label}</label>
              <input
                type="text"
                inputMode={digitsOnly ? "numeric" : undefined}
                className={inputClass}
                value={form[key]}
                onChange={(e) =>
                  setField(
                    key,
                    digitsOnly
                      ? e.target.value.replace(/[^0-9]/g, "")
                      : e.target.value,
                  )
                }
                placeholder={placeholder}
              />
              {isAge && errors.age && (
                <span className={errorClass}>{errors.age}</span>
              )}
            </div>
          );
        })}

        <div className="mb-3">
          <label className={labelClass}>{str.editLabel_documentType}</label>
          <select
            className={inputClass}
            value={form.documentType}
            onChange={(e) => setField("documentType", e.target.value)}
          >
            {Object.entries(DOCUMENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className={labelClass}>{str.editLabel_bloodType}</label>
          <select
            className={inputClass}
            value={form.bloodType}
            onChange={(e) => setField("bloodType", e.target.value)}
          >
            <option value="">{str.editBloodTypePlaceholder}</option>
            {Object.entries(BLOOD_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 mb-1 text-[13px] text-op-text">
          <input
            type="checkbox"
            checked={form.hasPacemaker}
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
            onPress={reporter.searchAddress}
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
                  onClick={() => reporter.pickAddressResult(r)}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-row justify-end mt-6 gap-4">
          <AppButton title={str.btnCancel} onPress={onCancel} variant="outline" />
          <AppButton title={str.operatorReportSubmit} onPress={onSubmit} />
        </div>
      </div>
    </div>
  );
}
