import { createContext, useContext, useEffect, useState } from "react";
import { ReactNode, ReactElement } from "react";
import { OperatorUser } from "@/lib/models";
import { UserPersistError } from "@/lib/api/errors";
import { getItem, setItem, deleteItem } from "@/lib/utils/storage";

const STORE_KEY = "operator_user";

type OperatorUserContent = {
  operatorUser: OperatorUser | null;
  setOperatorUser: (user: OperatorUser) => Promise<void>;
  clearOperatorUser: () => Promise<void>;
  isLoadingUser: boolean;
};

export const OperatorUserContext = createContext<OperatorUserContent>({
  operatorUser: null,
  setOperatorUser: async () => {},
  clearOperatorUser: async () => {},
  isLoadingUser: true,
});

/**
 * Provider component for OperatorUserContext.
 * Rehydrates from SecureStore on mount and persists every update.
 */
export function OperatorUserProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const [operatorUser, setOperatorUserState] = useState<OperatorUser | null>(null);
  const [isLoadingUser, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const stored = await getItem(STORE_KEY);
        if (stored) {
          setOperatorUserState(JSON.parse(stored) as OperatorUser);
        }
      } catch (error) {
        console.warn("OperatorUserProvider: failed to load stored user", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const setOperatorUser = async (user: OperatorUser): Promise<void> => {
    try {
      await setItem(STORE_KEY, JSON.stringify(user));
      setOperatorUserState(user);
    } catch (error) {
      console.warn("OperatorUserProvider: failed to persist user", error);
      throw new UserPersistError();
    }
  };

  const clearOperatorUser = async (): Promise<void> => {
    try {
      await deleteItem(STORE_KEY);
      setOperatorUserState(null);
    } catch (error) {
      console.warn("OperatorUserProvider: failed to clear user", error);
      throw new UserPersistError();
    }
  };

  return (
    <OperatorUserContext.Provider
      value={{ operatorUser, setOperatorUser, clearOperatorUser, isLoadingUser }}
    >
      {children}
    </OperatorUserContext.Provider>
  );
}

/**
 * Custom hook to read and update the logged-in OperatorUser.
 */
export const useOperatorUser = () => useContext(OperatorUserContext);
