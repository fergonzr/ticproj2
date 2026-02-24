import { Stack } from "expo-router";

export default function ParamedicLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="LoginScreen"
    />
  );
}
