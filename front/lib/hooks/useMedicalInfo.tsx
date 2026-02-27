import { createContext, useContext, useEffect, useState } from "react";
import { ReactNode, ReactElement } from "react";
import * as SecureStore from "expo-secure-store";
import { MedicalInfo } from "@/lib/models";

// Constants 

const STORE_KEY = "medical_info";

// Types 

type MedicalInfoContent = {
  medicalInfo: MedicalInfo | null;
  setMedicalInfo: (info: MedicalInfo) => Promise<void>;
  isLoadingMedicalInfo: boolean;
};

// Context 

export const MedicalInfoContext = createContext<MedicalInfoContent>({
  medicalInfo: null,
  setMedicalInfo: async () => {},
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
  const [medicalInfo, setMedicalInfoState] = useState<MedicalInfo | null>(null);
  const [isLoadingMedicalInfo, setIsLoading] = useState(true);

  // Rehydrate from SecureStore when the provider mounts
  useEffect(() => {
    const loadStoredInfo = async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (stored) {
          setMedicalInfoState(JSON.parse(stored) as MedicalInfo);
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
  const setMedicalInfo = async (info: MedicalInfo): Promise<void> => {
    try {
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(info));
      setMedicalInfoState(info);
    } catch (error) {
      console.warn("MedicalInfoProvider: failed to persist info", error);
      throw error;
    }
  };

  return (
    <MedicalInfoContext.Provider
      value={{ medicalInfo, setMedicalInfo, isLoadingMedicalInfo }}
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