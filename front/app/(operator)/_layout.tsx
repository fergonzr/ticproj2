import { ReactElement } from "react";
import { Stack } from "expo-router";
import { OperatorUserProvider } from "@/lib/hooks/operator/useOperatorUser";

export default function OperatorLayout(): ReactElement {
  return (
    <OperatorUserProvider>
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName="Login"
      />
    </OperatorUserProvider>
  );
}
