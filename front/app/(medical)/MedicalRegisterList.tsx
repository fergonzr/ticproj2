import { View, Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useMedicalInfo, MAX_REGISTERED_PERSONS } from "@/lib/hooks/useMedicalInfo";
import AppButton from "@/lib/components/AppButton";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";
import * as str from "@/lib/strings";
import "../../global.css";

/**
 * Screen that lists all registered medical profiles.
 * Provides buttons to edit or delete each entry, and an add button at the bottom.
 */
export default function MedicalRegisterList() {
  const { medicalInfoList, removeMedicalInfo } = useMedicalInfo();
  const { top, bottom } = useSafeAreaInsets();

  const isAtPersonLimit = medicalInfoList.length >= MAX_REGISTERED_PERSONS;

  const handleDelete = (index: number) => {
    Alert.alert(str.alertConfirmDelete, str.alertConfirmDeleteMessage, [
      { text: str.btnCancel, style: "cancel" },
      {
        text: str.btnDelete,
        style: "destructive",
        onPress: async () => {
          try {
            await removeMedicalInfo(index);
            Alert.alert(str.alertSuccess, str.alertDeleteSuccess);
          } catch {
            Alert.alert(str.alertError, str.alertDeleteFailed);
          }
        },
      },
    ]);
  };

  const handleEdit = (index: number) => {
    router.push({ pathname: "/(medical)/MedicalRegister", params: { index } });
  };

  const handleAdd = () => {
    if (isAtPersonLimit) {
      Alert.alert(str.alertWarning, str.alertMaxPersonsReached);
      return;
    }
    router.push("/(medical)/MedicalRegister");
  };

  return (
    <View style={{ flex: 1, paddingTop: top }}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: bottom + 24 }}
      >
        {medicalInfoList.length === 0 ? (
          <View className="items-center mt-10">
            <Text className="text-text text-14">{str.medicalRegisterListEmpty}</Text>
          </View>
        ) : (
          medicalInfoList.map((person, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between border border-border rounded-lg px-4 py-3 mb-3 bg-background"
            >
              <View className="flex-1">
                <Text className="text-text font-bold text-14">
                  {person.firstName} {person.lastName}
                </Text>
                <Text className="text-text text-14">
                  {str.labelAge}: {person.age} {str.unitYears}
                </Text>
              </View>
              <View className="flex-row gap-2 items-center">
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, padding: spacing.sm, borderRadius: spacing.sm, alignItems: "center" }}
                  onPress={() => handleEdit(index)}
                >
                  <AntDesign name="edit" size={20} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: colors.error, padding: spacing.sm, borderRadius: spacing.sm, alignItems: "center" }}
                  onPress={() => handleDelete(index)}
                >
                  <AntDesign name="delete" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <AppButton
          title={str.btnAddRecord}
          onPress={handleAdd}
          disabled={isAtPersonLimit}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </View>
  );
}
