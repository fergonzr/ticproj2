import { Drawer } from "expo-router/drawer";
import * as str from "@/lib/strings";
import { ReactElement } from "react";
import {
  MockEmergencyUpdateListener,
  MockCaseReportSubmitter,
  MockParamedicAuthenticator,
  MockEmergencyAssignmentListener,
  MockRouteProvider,
  MockParamedicLocationTracker,
  MockPQRSSubmissionSubmitter,
} from "@/lib/api/mock";
import { ApiContext } from "@/lib/api/useApi";
import { MedicalInfoProvider } from "@/lib/hooks/useMedicalInfo";
import { ThemeProvider } from "@rneui/themed";
import { ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { rneuiTheme, navTheme } from "@/lib/themes/theme";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/**
 * Drawer root layout of the app.
 *
 * Designed to allow navigation mostly between the Paramedic and
 * Citizen routes, as well as the various form views there are.
 * @category Component
 * @returns ReactElement
 */
export default function RootLayout(): ReactElement {
  return (
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
          }}
        >
          <MedicalInfoProvider>
            <Drawer
              screenOptions={{
                drawerPosition: "right",
              }}
              initialRouteName="Main"
            >
              <Drawer.Screen
                name="Main"
                options={{
                  drawerLabel: str.index,
                  title: str.index,
                }}
              ></Drawer.Screen>
              <Drawer.Screen
                name="MedicalRegister"
                options={{
                  drawerLabel: str.medicalRegister,
                  title: str.medicalRegister,
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
                name="(paramedic)"
                options={{
                  drawerLabel: str.paramedic,
                  title: str.paramedic,
                }}
              ></Drawer.Screen>
            </Drawer>
          </MedicalInfoProvider>
        </ApiContext.Provider>
      </NavThemeProvider>
    </ThemeProvider>
  );
}
