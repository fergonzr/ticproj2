import { useCallback, useState } from "react";
import type { GeoLocation, MedicalInfo } from "@/lib/models";
import * as str from "@/lib/strings";
import { geocodeAddress, type GeocodeResult } from "../../map/geocoding";

/** Editable shape of the report form. `allergies`/`diseases` are
 *  comma-separated text here and split into `string[]` when the payload
 *  is built. */
export interface EmergencyReporterForm {
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

export type GeocodingState = "idle" | "searching" | "error" | "empty";

export interface ReporterErrors {
  address?: string;
  age?: string;
}

/** A built report payload. `location` is non-null: it is required and
 *  validated before the payload is returned. */
export interface EmergencyReporterPayload {
  location: GeoLocation;
  medicalInfo: MedicalInfo | null;
}

export interface EmergencyReporter {
  form: EmergencyReporterForm;
  setField: (field: keyof EmergencyReporterForm, value: string | boolean) => void;
  searchAddress: () => Promise<void>;
  addressResults: GeocodeResult[];
  pickAddressResult: (result: GeocodeResult) => void;
  geocodingState: GeocodingState;
  errors: ReporterErrors;
  /** Validates and returns the payload, or `null` when validation fails
   *  (in which case `errors` is populated). */
  buildPayload: () => EmergencyReporterPayload | null;
  reset: () => void;
}

const EMPTY_FORM: EmergencyReporterForm = {
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

/** Form state for an operator reporting a brand-new emergency. Unlike
 *  `useEmergencyEditor`, there is no pre-existing profile: no field is
 *  locked, nothing is pre-filled, and a resolved location is required. */
export function useEmergencyReporter(): EmergencyReporter {
  const [form, setForm] = useState<EmergencyReporterForm>(EMPTY_FORM);
  const [resolvedLocation, setResolvedLocation] = useState<GeoLocation | null>(
    null,
  );
  const [addressResults, setAddressResults] = useState<GeocodeResult[]>([]);
  const [geocodingState, setGeocodingState] = useState<GeocodingState>("idle");
  const [errors, setErrors] = useState<ReporterErrors>({});

  const setField = useCallback(
    (field: keyof EmergencyReporterForm, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Editing the address invalidates any previously resolved coordinate.
      if (field === "address") {
        setResolvedLocation(null);
        setAddressResults([]);
        setGeocodingState("idle");
      }
    },
    [],
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
    setAddressResults([]);
    setGeocodingState("idle");
    setErrors((prev) => ({ ...prev, address: undefined }));
  }, []);

  const buildPayload = useCallback((): EmergencyReporterPayload | null => {
    const nextErrors: ReporterErrors = {};

    // Location is required: the operator must resolve an address first.
    if (resolvedLocation === null) {
      nextErrors.address = str.operatorReportErrorLocation;
    }

    // A provided age must be a whole number in [0, 150). Empty age is fine.
    const trimmedAge = form.age.trim();
    if (
      trimmedAge !== "" &&
      (!/^\d+$/.test(trimmedAge) || parseInt(trimmedAge, 10) >= 150)
    ) {
      nextErrors.age = str.editErrorAge;
    }

    // Medical info is fully optional. If the operator touched any medical
    // field, submit a complete profile; otherwise submit `null` (a
    // third-party-style report).
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
    if (touchedMedical) {
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
    // resolvedLocation is non-null here — verified above.
    return { location: resolvedLocation as GeoLocation, medicalInfo };
  }, [form, resolvedLocation]);

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setResolvedLocation(null);
    setAddressResults([]);
    setGeocodingState("idle");
    setErrors({});
  }, []);

  return {
    form,
    setField,
    searchAddress,
    addressResults,
    pickAddressResult,
    geocodingState,
    errors,
    buildPayload,
    reset,
  };
}
