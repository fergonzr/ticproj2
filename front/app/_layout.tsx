import { Drawer } from "expo-router/drawer";
import { Stack } from "expo-router";
import * as str from "@/lib/strings";
import { ReactElement } from "react";
import { Platform } from "react-native";
import {
  MockEmergencyUpdateListener,
  MockCaseReportSubmitter,
  MockParamedicAuthenticator,
  MockEmergencyAssignmentListener,
  MockRouteProvider,
  MockParamedicLocationTracker,
  MockPQRSSubmissionSubmitter,
  MockOperatorAuthenticator,
} from "@/lib/api/mock";
import { ApiContext } from "@/lib/api/useApi";
import { MedicalInfoProvider } from "@/lib/hooks/useMedicalInfo";
import { ThemeProvider } from "@rneui/themed";
import { ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { rneuiTheme, navTheme } from "@/lib/themes/theme";
import { View, Text } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Providers = ({ children }: { children: ReactElement }) => (
  <ThemeProvider theme={rneuiTheme}>
    <NavThemeProvider value={navTheme}>
      <ApiContext.Provider
        value={{
          emergencyUpdateListener: new MockEmergencyUpdateListener(),
          caseReportSubmitter: new MockCaseReportSubmitter(),
          paramedicAuthenticator: new MockParamedicAuthenticator(),
          emergencyAssignmentListener: new MockEmergencyAssignmentListener(),
          routeProvider: new MockRouteProvider(),
          paramedicLocationTracker: new MockParamedicLocationTracker(),
          pqrsSubmissionSubmitter: new MockPQRSSubmissionSubmitter(),
          operatorAuthenticator: new MockOperatorAuthenticator(),
        }}
      >
        {children}
      </ApiContext.Provider>
    </NavThemeProvider>
  </ThemeProvider>
);

/**
 * Drawer root layout of the app.
 *
 * Designed to allow navigation mostly between the Paramedic and
 * Citizen routes, as well as the various form views there are.
 * @category Component
 * @returns ReactElement
 */
export default function RootLayout(): ReactElement {
  if (Platform.OS === "web") {
    return (
      <Providers>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(operator)" />
        </Stack>
      </Providers>
    );
  }

  const CitizenDrawerContent = (props: any) => {
    const { top } = useSafeAreaInsets();
    const go = (name: string) => props.navigation.navigate(name);
    const activeName = props.state.routeNames?.[props.state.index];

    return (
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flex: 1, paddingTop: top, paddingBottom: 16 }}
      >
        {/* Citizen section */}
        <View>
          <DrawerItem
            label={str.index}
            focused={activeName === "index"}
            onPress={() => go("index")}
          />
          <DrawerItem
            label={str.medicalRegisterList}
            focused={activeName === "(medical)"}
            onPress={() => go("(medical)")}
          />
          <DrawerItem
            label={str.aboutUsTitle}
            focused={activeName === "AboutUs"}
            onPress={() => go("AboutUs")}
          />
          <DrawerItem
            label={str.pqrs}
            focused={activeName === "PQRS"}
            onPress={() => go("PQRS")}
          />
        </View>

        {/* Spacer to push paramedic section down */}
        <View style={{ flex: 1 }} />

        {/* Paramedic section */}
        <View style={{ paddingTop: 24, marginTop: 24, borderTopWidth: 1, borderTopColor: "#e0e0e0" }}>
          <Text style={{ paddingHorizontal: 16, fontWeight: "600" }}>
            {str.paramedicMenuSectionTitle}
          </Text>
          <Text style={{ paddingHorizontal: 16, marginTop: 2, color: "#757575" }}>
            {str.paramedicMenuSectionSubtitle}
          </Text>
          <DrawerItem
            label={str.paramedic}
            focused={activeName === "(paramedic)"}
            onPress={() => go("(paramedic)")}
          />
        </View>

        {/* Operator section */}
        <View style={{ paddingTop: 16, marginTop: 16, borderTopWidth: 1, borderTopColor: "#e0e0e0" }}>
          <Text style={{ paddingHorizontal: 16, fontWeight: "600" }}>Operador</Text>
          <Text style={{ paddingHorizontal: 16, marginTop: 2, color: "#757575" }}>
            Panel de despacho
          </Text>
          <DrawerItem
            label="Panel Operador"
            focused={activeName === "(operator)"}
            onPress={() => go("(operator)")}
          />
        </View>
      </DrawerContentScrollView>
    );
  };

  return (
    <Providers>
      <MedicalInfoProvider>
        <Drawer
          screenOptions={{
            drawerPosition: "right",
          }}
          drawerContent={(props) => <CitizenDrawerContent {...props} />}
          initialRouteName="index"
        >
          <Drawer.Screen
            name="index"
            options={{
              drawerLabel: str.index,
              title: str.index,
            }}
          ></Drawer.Screen>
          <Drawer.Screen
            name="(medical)"
            options={{
              drawerLabel: str.medicalRegisterList,
              title: str.medicalRegisterList,
            }}
          ></Drawer.Screen>
          <Drawer.Screen
            name="AboutUs"
            options={{
              drawerLabel: str.aboutUsTitle,
              title: str.aboutUsTitle,
            }}
          ></Drawer.Screen>
          <Drawer.Screen
            name="PQRS"
            options={{
              drawerLabel: str.pqrs,
              title: str.pqrs,
            }}
          ></Drawer.Screen>
          <Drawer.Screen
            name="(paramedic)"
            options={{
              drawerLabel: str.paramedic,
              title: str.paramedic,
            }}
          ></Drawer.Screen>
          <Drawer.Screen
            name="(operator)"
            options={{
              drawerLabel: "Panel Operador",
              title: "Panel Operador",
            }}
          ></Drawer.Screen>
        </Drawer>
      </MedicalInfoProvider>
    </Providers>
  );
}
