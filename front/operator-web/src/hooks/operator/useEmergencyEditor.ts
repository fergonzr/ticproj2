import { useCallback, useEffect, useState } from "react";
import type { OperatorEmergency } from "@/lib/api/interfaces";
import type { GeoLocation, MedicalInfo } from "@/lib/models";
import * as str from "@/lib/strings";
import {
  geocodeAddress,
  reverseGeocode,
  type GeocodeResult,
} from "../../map/geocoding";

/** Editable shape of the form. `allergies`/`diseases` are comma-separated
 *  text here and split into `string[]` only when the payload is built. */
export interface EmergencyEditorForm {
  firstName: string;
  lastName: string;
  phone: string;
  documentType: string; // key of DOCUMENT_TYPES
  documentNumber: string;
  age: string;
  bloodType: string; // key of BLOOD_TYPES, or "" when unset
  allergies: string;
  diseases: string;
  hasPacemaker: boolean;
  address: string;
}

/** Medical fields subject to the per-field locking rule. */
export type MedicalField =
  | "firstName"
  | "lastName"
  | "phone"
  | "documentType"
  | "documentNumber"
  | "age"
  | "bloodType"
  | "allergies"
  | "diseases"
  | "hasPacemaker";

export type GeocodingState = "idle" | "searching" | "error" | "empty";

export interface EditorErrors {
  bloodType?: string;
  address?: string;
  age?: string;
}

export interface EmergencyEditorPayload {
  location: GeoLocation | null;
  medicalInfo: MedicalInfo | null;
}

export interface EmergencyEditor {
  form: EmergencyEditorForm;
  setField: (field: keyof EmergencyEditorForm, value: string | boolean) => void;
  isLocked: (field: MedicalField) => boolean;
  searchAddress: () => Promise<void>;
  addressResults: GeocodeResult[];
  pickAddressResult: (result: GeocodeResult) => void;
  geocodingState: GeocodingState;
  errors: EditorErrors;
  /** Validates and returns the payload, or `null` when validation fails
   *  (in which case `errors` is populated). */
  buildPayload: () => EmergencyEditorPayload | null;
}

const EMPTY_FORM: EmergencyEditorForm = {
  firstName: "",
  lastName: "",
  phone: "",
  documentType: "NATIONAL_ID",
  documentNumber: "",
  age: "",
  bloodType: "",
  allergies: "",
  diseases: "",
  hasPacemaker: false,
  address: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

export function useEmergencyEditor(
  emergency: OperatorEmergency | null,
): EmergencyEditor {
  const [form, setForm] = useState<EmergencyEditorForm>(EMPTY_FORM);
  const [resolvedLocation, setResolvedLocation] = useState<GeoLocation | null>(
    null,
  );
  const [addressDirty, setAddressDirty] = useState(false);
  const [addressResults, setAddressResults] = useState<GeocodeResult[]>([]);
  const [geocodingState, setGeocodingState] = useState<GeocodingState>("idle");
  const [errors, setErrors] = useState<EditorErrors>({});

  const info = emergency?.medicalInfo ?? null;
  const hadProfile = info !== null;

  // Re-initialize only when a *different* emergency is opened (by id), so a
  // background event that replaces the emergency object mid-edit does not
  // reset the form.
  useEffect(() => {
    if (!emergency) {
      setForm(EMPTY_FORM);
      setResolvedLocation(null);
      setAddressDirty(false);
      setAddressResults([]);
      setGeocodingState("idle");
      setErrors({});
      return;
    }
    const m = emergency.medicalInfo;
    setForm({
      firstName: m?.firstName ?? "",
      lastName: m?.lastName ?? "",
      phone: m?.phone ?? "",
      documentType: m?.documentType ?? "NATIONAL_ID",
      documentNumber: m?.documentNumber ?? "",
      age: m?.age ?? "",
      bloodType: m?.bloodType ?? "",
      allergies: (m?.allergies ?? []).join(", "),
      diseases: (m?.diseases ?? []).join(", "),
      hasPacemaker: m?.hasPacemaker === true,
      address: "",
    });
    setResolvedLocation(emergency.location);
    setAddressDirty(false);
    setAddressResults([]);
    setGeocodingState("idle");
    setErrors({});

    // Reverse-geocode an existing location into a readable address.
    const loc = emergency.location;
    if (loc) {
      let cancelled = false;
      reverseGeocode(loc.latitude, loc.longitude).then((addr) => {
        if (cancelled || !addr) return;
        setForm((prev) => ({ ...prev, address: addr }));
      });
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergency?.id]);

  const setField = useCallback(
    (field: keyof EmergencyEditorForm, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field === "address") {
        setAddressDirty(true);
        setAddressResults([]);
        setGeocodingState("idle");
      }
    },
    [],
  );

  // A field is locked when it already holds a value, except `phone` which is
  // always editable. For a third-party emergency `info` is null, so nothing
  // is locked. The selects and checkbox count as "has a value" only when a
  // registered profile exists.
  const isLocked = useCallback(
    (field: MedicalField): boolean => {
      if (field === "phone") return false;
      if (info === null) return false;
      switch (field) {
        case "firstName":
          return info.firstName !== "";
        case "lastName":
          return info.lastName !== "";
        case "documentNumber":
          return info.documentNumber !== "";
        case "age":
          return info.age !== "";
        case "allergies":
          return info.allergies.length > 0;
        case "diseases":
          return info.diseases.length > 0;
        case "documentType":
        case "bloodType":
        case "hasPacemaker":
          return true;
        default:
          return false;
      }
    },
    [info],
  );

  const searchAddress = useCallback(async () => {
    if (form.address.trim() === "") return;
    setGeocodingState("searching");
    setAddressResults([]);
    try {
      const results = await geocodeAddress(form.address);
      if (results.length === 0) {
        setGeocodingState("empty");
        return;
      }
      setAddressResults(results);
      setGeocodingState("idle");
    } catch {
      setGeocodingState("error");
    }
  }, [form.address]);

  const pickAddressResult = useCallback((result: GeocodeResult) => {
    setForm((prev) => ({ ...prev, address: result.label }));
    setResolvedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setAddressDirty(false);
    setAddressResults([]);
    setGeocodingState("idle");
    setErrors((prev) => ({ ...prev, address: undefined }));
  }, []);

  const buildPayload = useCallback((): EmergencyEditorPayload | null => {
    const nextErrors: EditorErrors = {};

    // A typed-but-unresolved address blocks the save.
    if (addressDirty && form.address.trim() !== "") {
      nextErrors.address = str.editErrorAddress;
    }

    // A provided age must be a whole number in [0, 150). An empty age is
    // allowed here since the operator may not know the patient's age.
    const trimmedAge = form.age.trim();
    if (
      trimmedAge !== "" &&
      (!/^\d+$/.test(trimmedAge) || parseInt(trimmedAge, 10) >= 150)
    ) {
      nextErrors.age = str.editErrorAge;
    }

    // Decide whether a medical profile is submitted.
    const touchedMedical =
      form.firstName !== "" ||
      form.lastName !== "" ||
      form.phone !== "" ||
      form.documentNumber !== "" ||
      form.age !== "" ||
      form.allergies.trim() !== "" ||
      form.diseases.trim() !== "" ||
      form.bloodType !== "" ||
      form.hasPacemaker;

    let medicalInfo: MedicalInfo | null = null;
    if (hadProfile || touchedMedical) {
      // bloodType is required only when creating a brand-new profile.
      if (!hadProfile && form.bloodType === "") {
        nextErrors.bloodType = str.editErrorBloodType;
      }
      medicalInfo = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        age: form.age,
        bloodType: form.bloodType,
        allergies: splitList(form.allergies),
        diseases: splitList(form.diseases),
        hasPacemaker: form.hasPacemaker,
        dataConsent: null,
      };
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;
    return { location: resolvedLocation, medicalInfo };
  }, [addressDirty, form, hadProfile, resolvedLocation]);

  return {
    form,
    setField,
    isLocked,
    searchAddress,
    addressResults,
    pickAddressResult,
    geocodingState,
    errors,
    buildPayload,
  };
}
