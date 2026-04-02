import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { OperatorUser } from "@/lib/models";

const STORE_KEY = "operator_user";

const storage = {
  get: async (): Promise<string | null> => {
    if (Platform.OS === "web") {
      return localStorage.getItem(STORE_KEY);
    }
    return SecureStore.getItemAsync(STORE_KEY);
  },
  set: async (value: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.setItem(STORE_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(STORE_KEY, value);
  },
  remove: async (): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.removeItem(STORE_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(STORE_KEY);
  },
};

interface OperatorUserContent {
  operatorUser: OperatorUser | null;
  setOperatorUser: (user: OperatorUser) => Promise<void>;
  clearOperatorUser: () => Promise<void>;
  isLoadingUser: boolean;
}

const OperatorUserContext = createContext<OperatorUserContent>({
  operatorUser: null,
  setOperatorUser: async () => {},
  clearOperatorUser: async () => {},
  isLoadingUser: true,
});

export function OperatorUserProvider({ children }: { children: ReactNode }) {
  const [operatorUser, setOperatorUserState] = useState<OperatorUser | null>(null);
  const [isLoadingUser, setIsLoading] = useState(true);

  useEffect(() => {
    storage
      .get()
      .then((stored) => {
        if (stored) setOperatorUserState(JSON.parse(stored) as OperatorUser);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setOperatorUser = async (user: OperatorUser): Promise<void> => {
    await storage.set(JSON.stringify(user));
    setOperatorUserState(user);
  };

  const clearOperatorUser = async (): Promise<void> => {
    await storage.remove();
    setOperatorUserState(null);
  };

  return (
    <OperatorUserContext.Provider
      value={{ operatorUser, setOperatorUser, clearOperatorUser, isLoadingUser }}
    >
      {children}
    </OperatorUserContext.Provider>
  );
}

export const useOperatorUser = () => useContext(OperatorUserContext);
