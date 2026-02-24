import { Drawer } from "expo-router/drawer";
import { View } from "react-native";
import * as str from "@/lib/strings";
import { DrawerToggleButton } from "@react-navigation/drawer";

export default function RootLayout() {
  return (
    <Drawer initialRouteName="Main">
      <Drawer.Screen
        name="Main"
        options={{
          drawerLabel: str.index,
          title: str.index,
        }}
      ></Drawer.Screen>
      <Drawer.Screen
        name="(paramedic)"
        options={{
          drawerLabel: str.loginPrompt,
          title: str.loginPrompt,
        }}
      ></Drawer.Screen>
      <Drawer.Screen
        name="MedicalRegister"
        options={{
          drawerLabel: str.medicalRegister,
          title: str.medicalRegister,
        }}
      ></Drawer.Screen>
    </Drawer>
  );
}
