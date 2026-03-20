import SIEELogo from "@/lib/components/SieeLogo";
import { View, Text, Animated, Alert, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import * as str from "@/lib/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, ReactElement } from "react";
import { EmergencyCase, EmergencyStatus, MedicalInfo } from "@/lib/models";
import { useApi } from "@/lib/api/useApi";
import { useMedicalInfo } from "@/lib/hooks/useMedicalInfo";
import { useEmergencyStatus } from "@/lib/hooks/useEmergencyStatus";
import { getCurrentLocation } from "@/lib/utils/location";
import EmergencyBtn from "@/lib/components/EmergencyBtn";
import PersonSelector from "@/lib/components/PersonSelector";

const DEFAULT_TIMEOUT_DELAY_SECONDS: number = 2;
const EMERGENCY_REPORT_TEL: string = "(604) 276 66 66";

/**
 * Main Screen of the app
 */
export default function Main(): ReactElement {
  const [emergencyCase, setEmergencyCase] = useState<EmergencyCase | null>(null);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState<number | null>(null);
  const { emergencyUpdateListener } = useApi();
  const { medicalInfoList } = useMedicalInfo();
  const { textColor, onStatusChange } = useEmergencyStatus();

  const getSelectedMedicalInfo = (): MedicalInfo | null => {
    if (selectedPersonIndex !== null && medicalInfoList.length > 0) {
      return medicalInfoList[selectedPersonIndex];
    }
    return null;
  };

  const sendAlert = async () => {
    const medicalInfo = getSelectedMedicalInfo();
    const location = await getCurrentLocation();

    if (location === null) {
      Alert.alert(str.alertWarning, str.alertLocationNotAvailable, [
        { text: str.btnOK, style: "default" },
      ]);
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${EMERGENCY_REPORT_TEL}`);

    setEmergencyCase(
      await emergencyUpdateListener.reportEmergency(
        {
          reportedOn: new Date(),
          medicalInfo: medicalInfo,
          location: location,
        },
        (emergency) => {
          const statusKey = EmergencyStatus[emergency.emergencyState];

          if (
            emergency.emergencyState === EmergencyStatus.CLOSED ||
            emergency.emergencyState === EmergencyStatus.CANCELLED
          ) {
            setEmergencyCase(null);
          } else {
            setEmergencyCase(emergency);
          }

          onStatusChange(statusKey);
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
      <Animated.Text
        className="text-center text-4xl my-auto mx-16"
        style={{ color: textColor }}
      >
        {message}
      </Animated.Text>
    );
  };

  return (
    <SafeAreaView className="flex flex-col align-middle gap-4">
      <View className="mx-4">
        <PersonSelector
          medicalInfoList={medicalInfoList}
          selectedPersonIndex={selectedPersonIndex}
          onSelect={setSelectedPersonIndex}
          label={str.labelReportFor}
          showThirdPartyOption={true}
        />
      </View>
      <SIEELogo></SIEELogo>

      <Text className="text-4xl font-bold text-center text-danger">
        {str.emergency}
      </Text>

      <View className="mt-8 flex flex-row align-middle justify-center text-danger">
        <EmergencyBtn
          timeoutDelaySeconds={DEFAULT_TIMEOUT_DELAY_SECONDS}
          afterPress={sendAlert}
          disabled={emergencyCase !== null}
        >
          {getButtonContent()}
        </EmergencyBtn>
      </View>
      <Text className="mx-10 mt-8 text-2xl text-center font-bold text-gray-500">
        {str.tipText}
      </Text>
    </SafeAreaView>
  );
}
