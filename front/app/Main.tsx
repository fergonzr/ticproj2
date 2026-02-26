import SIEELogo from "@/lib/components/SieeLogo";
import { View } from "react-native";
import { Text } from "@rneui/themed";
import * as str from "@/lib/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, ReactElement } from "react";
import { EmergencyCase, EmergencyStatus } from "@/lib/models";
import { useApi } from "@/lib/api/useApi";
import EmergencyBtn from "@/lib/components/EmergencyBtn";

const DEFAULT_TIMEOUT_DELAY_SECONDS: number = 3;

/**
 * Main Screen of the app
 *
 * This screens allows citizens to report emergencies.
 * @returns ReactElement
 */
export default function Main(): ReactElement {
  const [emergencyCase, setEmergencyCase] = useState<EmergencyCase | null>(
    null,
  );
  const { emergencyUpdateListener } = useApi();

  const sendAlert = async () => {
    setEmergencyCase(
      await emergencyUpdateListener.reportEmergency(
        {
          reportedOn: new Date(),
          medicalInfo: {},
          location: {
            latitude: -4,
            longitude: 5,
          },
        },
        (emergency) => {
          if (
            emergency.emergencyState === EmergencyStatus.CLOSED ||
            emergency.emergencyState === EmergencyStatus.CANCELLED
          )
            setEmergencyCase(null);
          else setEmergencyCase(emergency);
        },
      ),
    );
  };

  const getButtonContent = () => {
    if (emergencyCase === null) {
      return (
        <Text className="text-red-600 text-center text-4xl my-auto mx-16">
          {str.emergencyBtnInitial}
        </Text>
      );
    }

    const status = emergencyCase.emergencyState;
    const message = str.emergencyStatusMessages[EmergencyStatus[status]];

    return (
      <Text className="text-red-600 text-center text-4xl my-auto mx-16">
        {message}
      </Text>
    );
  };

  return (
    <SafeAreaView className="flex flex-col align-middle">
      <SIEELogo></SIEELogo>
      <Text h2={true} className="text-center">
        {str.emergency}
      </Text>
      <EmergencyBtn
        timeoutDelaySeconds={DEFAULT_TIMEOUT_DELAY_SECONDS}
        afterPress={sendAlert}
        disabled={emergencyCase !== null}
        className="self-center my-6 aspect-square w-4/5 border-solid border-red-700 border-2 rounded-full"
      >
        {getButtonContent()}
      </EmergencyBtn>
    </SafeAreaView>
  );
}
