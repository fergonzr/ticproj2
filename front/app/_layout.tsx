import { Drawer } from "expo-router/drawer";
import * as str from "@/lib/strings";
import { ReactElement } from "react";
import { colors } from "@/lib/themes/Colors";
import {
  MockCaseReportSubmitter,
  MockEmergencyAssignmentListener,
  MockRouteProvider,
  MockParamedicLocationTracker,
  MockPQRSSubmissionSubmitter,
} from "@/lib/api/mock";
import {
  RealEmergencyUpdateListener,
  RealParamedicAuthenticator,
  RealOperatorAuthenticator,
  RealOperatorService,
} from "@/lib/api/real";
import { ApiContext } from "@/lib/api/useApi";
import { MedicalInfoProvider } from "@/lib/hooks/useMedicalInfo";
import { ThemeProvider } from "@rneui/themed";
import { ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { rneuiTheme, navTheme } from "@/lib/themes/theme";
import { View, Text } from "react-native";
import { DrawerItem, DrawerContentScrollView } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Drawer root layout of the app.
 *
 * Designed to allow navigation mostly between the Citizen, Paramedic and
 * Operator routes, as well as the various form views there are.
 * @category Component
 * @returns ReactElement
 */
export default function RootLayout(): ReactElement {
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

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Paramedic section */}
        <View
          style={{
            paddingTop: 24,
            marginTop: 24,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
          }}
        >
          <Text style={{ paddingHorizontal: 16, fontWeight: "600" }}>
            {str.paramedicMenuSectionTitle}
          </Text>
          <Text style={{ paddingHorizontal: 16, marginTop: 2, color: colors.grey4 }}>
            {str.paramedicMenuSectionSubtitle}
          </Text>
          <DrawerItem
            label={str.paramedic}
            focused={activeName === "(paramedic)"}
            onPress={() => go("(paramedic)")}
          />
        </View>

        {/* Operator section */}
        <View
          style={{
            paddingTop: 16,
            marginTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
          }}
        >
          <Text style={{ paddingHorizontal: 16, fontWeight: "600" }}>
            {str.operatorMenuSectionTitle}
          </Text>
          <Text style={{ paddingHorizontal: 16, marginTop: 2, color: colors.grey4 }}>
            {str.operatorMenuSectionSubtitle}
          </Text>
          <DrawerItem
            label={str.operator}
            focused={activeName === "(operator)"}
            onPress={() => go("(operator)")}
          />
        </View>
      </DrawerContentScrollView>
    );
  };

  return (
    <ThemeProvider theme={rneuiTheme}>
      <NavThemeProvider value={navTheme}>
        <ApiContext.Provider
          value={{
            emergencyUpdateListener: new RealEmergencyUpdateListener(),
            caseReportSubmitter: new MockCaseReportSubmitter(),
            paramedicAuthenticator: new RealParamedicAuthenticator(),
            emergencyAssignmentListener: new MockEmergencyAssignmentListener(),
            routeProvider: new MockRouteProvider(),
            paramedicLocationTracker: new MockParamedicLocationTracker(),
            pqrsSubmissionSubmitter: new MockPQRSSubmissionSubmitter(),
            operatorAuthenticator: new RealOperatorAuthenticator(),
            operatorService: new RealOperatorService(),
          }}
        >
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
              />
              <Drawer.Screen
                name="(medical)"
                options={{
                  drawerLabel: str.medicalRegisterList,
                  title: str.medicalRegisterList,
                }}
              />
              <Drawer.Screen
                name="AboutUs"
                options={{
                  drawerLabel: str.aboutUsTitle,
                  title: str.aboutUsTitle,
                }}
              />
              <Drawer.Screen
                name="PQRS"
                options={{
                  drawerLabel: str.pqrs,
                  title: str.pqrs,
                }}
              />
              <Drawer.Screen
                name="(paramedic)"
                options={{
                  drawerLabel: str.paramedic,
                  title: str.paramedic,
                }}
              />
              <Drawer.Screen
                name="(operator)"
                options={{
                  drawerLabel: str.operator,
                  title: str.operator,
                }}
              />
            </Drawer>
          </MedicalInfoProvider>
        </ApiContext.Provider>
      </NavThemeProvider>
    </ThemeProvider>
  );
}
