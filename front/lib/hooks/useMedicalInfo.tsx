import { createContext, useContext, useEffect, useState } from "react";
import { ReactNode, ReactElement } from "react";
import * as SecureStore from "expo-secure-store";
import { MedicalInfo } from "@/lib/models";
import {
  MedicalInfoSaveError,
  MaxPersonsReachedError,
} from "@/lib/api/errors";

// Constants

const STORE_KEY = "medical_info";

/** Maximum number of persons a user can register in the app. */
export const MAX_REGISTERED_PERSONS = 4;

// Migration

const OLD_DISEASE_LABELS: Record<string, string> = {
  CARPAL_TUNNEL: "Túnel carpiano",
  DIABETES: "Diabetes",
  HYPERTENSION: "Hipertensión",
  EPILEPSY: "Epilepsia",
  ASTHMA: "Asma",
};

function migrateMedicalInfo(raw: unknown): MedicalInfo {
  const r = raw as Record<string, unknown>;

  // Migrate allergies: old shape was { rhinitis, asthma, dermatitis } booleans
  let allergies: string[] = [];
  if (Array.isArray(r.allergies)) {
    allergies = r.allergies as string[];
  } else if (r.allergies && typeof r.allergies === "object") {
    const a = r.allergies as Record<string, boolean>;
    if (a.rhinitis) allergies.push("Rinitis");
    if (a.asthma) allergies.push("Asma");
    if (a.dermatitis) allergies.push("Dermatitis");
  }

  // Migrate diseases: old shape was disease: string (key of DISEASES)
  let diseases: string[] = [];
  if (Array.isArray(r.diseases)) {
    diseases = r.diseases as string[];
  } else if (typeof r.disease === "string" && r.disease !== "NONE") {
    const label = OLD_DISEASE_LABELS[r.disease];
    if (label) diseases.push(label);
  }

  return { ...(r as MedicalInfo), allergies, diseases };
}

// Types

type MedicalInfoContent = {
  medicalInfoList: MedicalInfo[];
  selectedPersonIndex: number | null;
  setMedicalInfo: (info: MedicalInfo, index: number) => Promise<void>;
  addMedicalInfo: (info: MedicalInfo) => Promise<void>;
  removeMedicalInfo: (index: number) => Promise<void>;
  setSelectedPersonIndex: (index: number | null) => void;
  isLoadingMedicalInfo: boolean;
};

// Context

export const MedicalInfoContext = createContext<MedicalInfoContent>({
  medicalInfoList: [],
  selectedPersonIndex: null,
  setMedicalInfo: async () => {},
  addMedicalInfo: async () => {},
  removeMedicalInfo: async () => {},
  setSelectedPersonIndex: () => {},
  isLoadingMedicalInfo: true,
});

// Provider

/**
 * Provider component for MedicalInfoContext.
 * Rehydrates from SecureStore on mount and persists every update.
 * Wrap the app root with this to make medical info available everywhere.
 */
export function MedicalInfoProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [medicalInfoList, setMedicalInfoList] = useState<MedicalInfo[]>([]);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState<number | null>(
    null,
  );
  const [isLoadingMedicalInfo, setIsLoading] = useState(true);

  // Rehydrate from SecureStore when the provider mounts
  useEffect(() => {
    const loadStoredInfo = async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const list: MedicalInfo[] = (Array.isArray(parsed) ? parsed : [parsed]).map(migrateMedicalInfo);
          setMedicalInfoList(list);
          setSelectedPersonIndex(0);
        }
      } catch (error) {
        console.warn("MedicalInfoProvider: failed to load stored info", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredInfo();
  }, []);

  /**
   * Persists the given MedicalInfo to SecureStore and updates React state.
   * Re-throws on failure so callers can show an error alert.
   */
  const setMedicalInfo = async (
    info: MedicalInfo,
    index: number,
  ): Promise<void> => {
    try {
      const updatedList = [...medicalInfoList];
      updatedList[index] = info;
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updatedList));
      setMedicalInfoList(updatedList);
    } catch (error) {
      console.warn("MedicalInfoProvider: failed to persist info", error);
      throw new MedicalInfoSaveError();
    }
  };

  /**
   * Adds a new MedicalInfo to the list.
   * @throws MaxPersonsReachedError when the user has reached MAX_REGISTERED_PERSONS.
   */
  const addMedicalInfo = async (info: MedicalInfo): Promise<void> => {
    if (medicalInfoList.length >= MAX_REGISTERED_PERSONS) {
      throw new MaxPersonsReachedError();
    }
    try {
      const updatedList = [...medicalInfoList, info];
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updatedList));
      setMedicalInfoList(updatedList);
      setSelectedPersonIndex(updatedList.length - 1);
    } catch (error) {
      if (error instanceof MaxPersonsReachedError) throw error;
      console.warn("MedicalInfoProvider: failed to add info", error);
      throw error;
    }
  };

  /**
   * Removes a MedicalInfo from the list
   */
  const removeMedicalInfo = async (index: number): Promise<void> => {
    try {
      const updatedList = medicalInfoList.filter((_, i) => i !== index);
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updatedList));
      setMedicalInfoList(updatedList);
      setSelectedPersonIndex(updatedList.length > 0 ? 0 : null);
    } catch (error) {
      console.warn("MedicalInfoProvider: failed to remove info", error);
      throw error;
    }
  };

  return (
    <MedicalInfoContext.Provider
      value={{
        medicalInfoList,
        selectedPersonIndex,
        setMedicalInfo,
        addMedicalInfo,
        removeMedicalInfo,
        setSelectedPersonIndex,
        isLoadingMedicalInfo,
      }}
    >
      {children}
    </MedicalInfoContext.Provider>
  );
}

// Hook

/**
 * Custom hook to read and update the citizen's MedicalInfo.
 * @returns The current MedicalInfo, a setter that persists to SecureStore,
 * and a loading flag for the initial rehydration.
 */
export const useMedicalInfo = () => useContext(MedicalInfoContext);
