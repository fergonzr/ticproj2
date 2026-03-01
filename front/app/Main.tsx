import SIEELogo from "@/lib/components/SieeLogo";
import { View, Text, Alert } from "react-native";
import { Text as RneuiText } from "@rneui/themed";
import * as str from "@/lib/strings";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, ReactElement } from "react";
import {
  EmergencyCase,
  EmergencyStatus,
  MedicalInfo,
  GeoLocation,
} from "@/lib/models";
import { useApi } from "@/lib/api/useApi";
import { useMedicalInfo } from "@/lib/hooks/useMedicalInfo";
import EmergencyBtn from "@/lib/components/EmergencyBtn";
import PersonSelector from "@/lib/components/PersonSelector";
import * as Location from "expo-location";

const DEFAULT_TIMEOUT_DELAY_SECONDS: number = 3;
const LOCATION_TIMEOUT_MS: number = 10000; // 10 seconds

/**
 * Gets the current location of the device
 * @returns Promise<GeoLocation | null> with latitude and longitude, or null if location cannot be determined
 */
const getCurrentLocation = async (): Promise<GeoLocation | null> => {
  try {
    // Check if location services are enabled
    const hasServicesEnabled = await Location.hasServicesEnabledAsync();
    if (!hasServicesEnabled) {
      console.warn("Location services are not enabled");
      return null;
    }

    // Request foreground location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Location permission denied");
      return null;
    }

    // Get current position with timeout
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // 10 seconds
      distanceInterval: 10, // 10 meters
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Location timeout")),
        LOCATION_TIMEOUT_MS,
      );
    });

    const location = await Promise.race([locationPromise, timeoutPromise]);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
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
    const location = await getCurrentLocation();

    // Show warning if location couldn't be determined
    if (location === null) {
      Alert.alert(str.alertWarning, str.alertLocationNotAvailable, [
        { text: str.btnOK, style: "default" },
      ]);
    }

    setEmergencyCase(
      await emergencyUpdateListener.reportEmergency(
        {
          reportedOn: new Date(),
          medicalInfo: medicalInfo,
          location: location, // Fallback to zero coordinates if location is null
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
