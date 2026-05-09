import { ReactElement, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AppButton from "@/lib/components/AppButton";
import { useApi } from "@/lib/api/useApi";
import { useActiveEmergency } from "@/app/(paramedic)/_layout";
import { ComplexityLevel, MedicalCenter } from "@/lib/models";
import * as str from "@/lib/strings";

const COMPLEXITY_LABEL: Record<ComplexityLevel, string> = {
  [ComplexityLevel.BASIC]: str.complexityBasic,
  [ComplexityLevel.INTERMEDIATE]: str.complexityIntermediate,
  [ComplexityLevel.HIGH]: str.complexityHigh,
};

export default function MedicalCenterTransfer(): ReactElement {
  const router = useRouter();
  const { emergencyAssignmentListener } = useApi();
  const { activeEmergency } = useActiveEmergency();
  const [centers, setCenters] = useState<MedicalCenter[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeEmergency?.id) return;
    let cancelled = false;
    emergencyAssignmentListener
      .getMedicalCenterRecommendations(activeEmergency.id)
      .then((list) => {
        if (!cancelled) setCenters(list);
      })
      .catch((e) => {
        if (!cancelled) {
          Alert.alert(str.alertError, str.transferLoadError);
          console.warn("Medical center fetch failed", e);
          setCenters([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeEmergency?.id, emergencyAssignmentListener]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await emergencyAssignmentListener.transferEmergency(selectedId);
      router.replace("/(paramedic)/PrehospitalCareReport");
    } catch (e) {
      Alert.alert(str.alertError, String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-6">
        <Text className="text-primary text-2xl font-bold text-center mb-1">
          {str.transferScreenTitle}
        </Text>
        <Text className="text-gray text-center text-base mb-6">
          {str.transferScreenSubtitle}
        </Text>

        {centers === null ? (
          <View className="flex-1 justify-center">
            <ActivityIndicator size="large" />
          </View>
        ) : centers.length === 0 ? (
          <Text className="text-gray text-center text-base mt-10">
            {str.transferEmptyState}
          </Text>
        ) : (
          <ScrollView className="flex-1">
            {centers.map((mc) => {
              const isSelected = selectedId === mc.id;
              return (
                <TouchableOpacity
                  key={mc.id}
                  className={`border-2 rounded-xl p-4 mb-3 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-white"
                  }`}
                  onPress={() => setSelectedId(mc.id)}
                >
                  <Text
                    className={`text-lg font-bold mb-1 ${
                      isSelected ? "text-primary" : "text-text"
                    }`}
                  >
                    {mc.name}
                  </Text>
                  <Text className="text-gray text-sm mb-1">{mc.phone}</Text>
                  <Text className="text-gray text-sm">
                    Máx: {COMPLEXITY_LABEL[mc.maxComplexityLevel]}
                    {mc.availableSlots !== null
                      ? `  ·  ${str.transferAvailableSlots}: ${mc.availableSlots}`
                      : ""}
                  </Text>
                  {mc.specialties.length > 0 && (
                    <Text className="text-gray text-xs mt-1">
                      {mc.specialties.join(" · ")}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View className="mt-4 mb-6">
          <AppButton
            title={str.transferConfirm}
            loadingTitle={str.btnSending}
            loading={submitting}
            disabled={!selectedId || submitting}
            onPress={handleConfirm}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
