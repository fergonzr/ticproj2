import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { OperatorUser } from "@/lib/models";

const STORE_KEY = "operator_user";

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
    SecureStore.getItemAsync(STORE_KEY)
      .then((stored) => {
        if (stored) setOperatorUserState(JSON.parse(stored) as OperatorUser);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setOperatorUser = async (user: OperatorUser): Promise<void> => {
    await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(user));
    setOperatorUserState(user);
  };

  const clearOperatorUser = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(STORE_KEY);
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
