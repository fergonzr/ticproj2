import { Stack } from "expo-router";
import { ReactElement } from "react";

/**
 * Simple Stack (push-pop navigation) layout to group the medical record screens.
 */
export default function MedicalLayout(): ReactElement {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="MedicalRegisterList"
    />
  );
}
