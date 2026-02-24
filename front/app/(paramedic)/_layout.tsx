import { Stack } from "expo-router";
import { ReactElement } from "react";

/**
 * Simple Stack (push-pop navigation) layout to group the paramedic screens.
 * @returns
 */
export default function ParamedicLayout(): ReactElement {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="LoginScreen"
    />
  );
}
