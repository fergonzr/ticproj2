import { Platform } from "react-native";
import { Redirect } from "expo-router";
import Main from "./Main";

export default function Index() {
  if (Platform.OS === "web") {
    return <Redirect href="/(operator)/Login" />;
  }
  return <Main />;
}
