import { ReactElement, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AppButton from "@/lib/components/AppButton";
import { useApi } from "@/lib/api/useApi";
import { ComplexityLevel } from "@/lib/models";
import * as str from "@/lib/strings";

interface Option {
  level: ComplexityLevel;
  title: string;
  description: string;
}

const OPTIONS: Option[] = [
  {
    level: ComplexityLevel.BASIC,
    title: str.complexityBasic,
    description: str.complexityBasicDesc,
  },
  {
    level: ComplexityLevel.INTERMEDIATE,
    title: str.complexityIntermediate,
    description: str.complexityIntermediateDesc,
  },
  {
    level: ComplexityLevel.HIGH,
    title: str.complexityHigh,
    description: str.complexityHighDesc,
  },
];

export default function ComplexityAssignment(): ReactElement {
  const router = useRouter();
  const { emergencyAssignmentListener } = useApi();
  const [selected, setSelected] = useState<ComplexityLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (selected === null) return;
    setSubmitting(true);
    try {
      await emergencyAssignmentListener.assignComplexity(selected);
      router.replace("/(paramedic)/MedicalCenterTransfer");
    } catch (e) {
      Alert.alert(str.alertError, String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6 pt-6">
        <Text className="text-primary text-2xl font-bold text-center mb-1">
          {str.complexityScreenTitle}
        </Text>
        <Text className="text-gray text-center text-base mb-6">
          {str.complexityScreenSubtitle}
        </Text>

        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.level;
          return (
            <TouchableOpacity
              key={opt.level}
              className={`border-2 rounded-xl p-4 mb-3 ${
                isSelected ? "border-primary bg-primary/5" : "border-border bg-white"
              }`}
              onPress={() => setSelected(opt.level)}
            >
              <Text
                className={`text-lg font-bold mb-1 ${
                  isSelected ? "text-primary" : "text-text"
                }`}
              >
                {opt.title}
              </Text>
              <Text className="text-gray text-sm">{opt.description}</Text>
            </TouchableOpacity>
          );
        })}

        <View className="mt-6 mb-10">
          <AppButton
            title={str.acceptRequest}
            loadingTitle={str.btnSending}
            loading={submitting}
            disabled={selected === null || submitting}
            onPress={handleConfirm}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
