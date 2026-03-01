import { createContext, useContext, useEffect, useState } from "react";
import { ReactNode, ReactElement } from "react";
import * as SecureStore from "expo-secure-store";
import { ParamedicUser } from "@/lib/models";
import { UserPersistError } from "@/lib/api/errors";

// Constants

const STORE_KEY = "paramedic_user";

// Types

type ParamedicUserContent = {
  paramedicUser: ParamedicUser | null;
  setParamedicUser: (user: ParamedicUser) => Promise<void>;
  clearParamedicUser: () => Promise<void>;
  isLoadingUser: boolean;
};

// Context

export const ParamedicUserContext = createContext<ParamedicUserContent>({
  paramedicUser: null,
  setParamedicUser: async () => {},
  clearParamedicUser: async () => {},
  isLoadingUser: true,
});

// Provider

/**
 * Provider component for ParamedicUserContext.
 * Rehydrates from SecureStore on mount and persists every update.
 * Wrap the paramedic route group with this to make the logged-in user available everywhere.
 */
export function ParamedicUserProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [paramedicUser, setParamedicUserState] = useState<ParamedicUser | null>(null);
  const [isLoadingUser, setIsLoading] = useState(true);

  // Rehydrate from SecureStore when the provider mounts
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (stored) {
          setParamedicUserState(JSON.parse(stored) as ParamedicUser);
        }
      } catch (error) {
        console.warn("ParamedicUserProvider: failed to load stored user", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  /**
   * Persists the given ParamedicUser to SecureStore and updates React state.
   * Re-throws on failure so callers can show an error alert.
   */
  const setParamedicUser = async (user: ParamedicUser): Promise<void> => {
    try {
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(user));
      setParamedicUserState(user);
    } catch (error) {
      console.warn("ParamedicUserProvider: failed to persist user", error);
      throw new UserPersistError();
    }
  };

  /**
   * Removes the stored ParamedicUser from SecureStore and clears React state.
   * Re-throws on failure so callers can show an error alert.
   */
  const clearParamedicUser = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORE_KEY);
      setParamedicUserState(null);
    } catch (error) {
      console.warn("ParamedicUserProvider: failed to clear user", error);
      throw new UserPersistError();
    }
  };

  return (
    <ParamedicUserContext.Provider
      value={{ paramedicUser, setParamedicUser, clearParamedicUser, isLoadingUser }}
    >
      {children}
    </ParamedicUserContext.Provider>
  );
}

// Hook

/**
 * Custom hook to read and update the logged-in ParamedicUser.
 * @returns The current ParamedicUser, a setter and a clear function that persist to SecureStore,
 * and a loading flag for the initial rehydration.
 */
export const useParamedicUser = () => useContext(ParamedicUserContext);
