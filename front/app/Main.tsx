import SIEELogo from "@/lib/components/SieeLogo";
import { View, Text } from "react-native";
import { Text as RneuiText } from "@rneui/themed";
import * as str from "@/lib/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, ReactElement } from "react";
import { EmergencyCase, EmergencyStatus, MedicalInfo } from "@/lib/models";
import { useApi } from "@/lib/api/useApi";
import { useMedicalInfo } from "@/lib/hooks/useMedicalInfo";
import EmergencyBtn from "@/lib/components/EmergencyBtn";
import PersonSelector from "@/lib/components/PersonSelector";

const DEFAULT_TIMEOUT_DELAY_SECONDS: number = 3;

// Fallback MedicalInfo used when the citizen hasn't filled the form yet
const EMPTY_MEDICAL_INFO: MedicalInfo = {
  firstName: "",
  lastName: "",
  phone: "",
  documentType: "NATIONAL_ID",
  documentNumber: "",
  age: "",
  allergies: { rhinitis: false, asthma: false, dermatitis: false },
  disease: "NONE",
  hasPacemaker: null,
  bloodType: "O_POSITIVE",
  dataConsent: null,
};

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
  const [selectedPersonIndex, setSelectedPersonIndex] = useState<number | null>(
    null,
  );
  const { emergencyUpdateListener } = useApi();
  const { medicalInfoList } = useMedicalInfo();

  const getSelectedMedicalInfo = (): MedicalInfo | null => {
    if (selectedPersonIndex !== null && medicalInfoList.length > 0) {
      return medicalInfoList[selectedPersonIndex];
    }
    return null;
  };

  const sendAlert = async () => {
    const medicalInfo = getSelectedMedicalInfo();

    setEmergencyCase(
      await emergencyUpdateListener.reportEmergency(
        {
          reportedOn: new Date(),
          medicalInfo: medicalInfo,
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
      {/* Person Selector for emergency reporting */}
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
      <RneuiText h2={true} className="text-center">
        {str.emergency}
      </RneuiText>

      <View className="mt-8 flex flex-row align-middle justify-center">
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
