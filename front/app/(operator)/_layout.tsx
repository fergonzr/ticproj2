import { Stack } from "expo-router";
import { ReactElement } from "react";
import { OperatorUserProvider } from "@/lib/hooks/useOperatorUser";

/**
 * Stack layout for the operator route group.
 * Wraps all operator screens with OperatorUserProvider so they can
 * read and update the logged-in operator's session.
 */
export default function OperatorLayout(): ReactElement {
  return (
    <OperatorUserProvider>
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName="LoginScreen"
      />
    </OperatorUserProvider>
  );
}
