import { View, Text, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useMedicalInfo, MAX_REGISTERED_PERSONS } from "@/lib/hooks/useMedicalInfo";
import { BLOOD_TYPES } from "@/lib/models";
import * as str from "@/lib/strings";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";
import { AppBar, ClinicalCard, Chip } from "@/lib/components/cl";
import "../../global.css";

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

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

  const handleEdit = (index: number) =>
    router.push({ pathname: "/(medical)/MedicalRegister", params: { index } });

  const handleAdd = () => {
    if (isAtPersonLimit) {
      Alert.alert(str.alertWarning, str.alertMaxPersonsReached);
      return;
    }
    router.push("/(medical)/MedicalRegister");
  };

  return (
    <View style={{ flex: 1, backgroundColor: mobileColors.bg, paddingTop: top }}>
      <AppBar
        title={str.medicalRegisterList}
        subtitle={`${medicalInfoList.length} persona${medicalInfoList.length !== 1 ? "s" : ""}`}
        trailing={
          <TouchableOpacity
            onPress={handleAdd}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: mobileColors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1, padding: 20, paddingBottom: bottom + 24, gap: 12 }}>
        {medicalInfoList.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: mobileColors.textSoft, fontSize: 14, fontFamily: "Inter_400Regular" }}>
              {str.medicalRegisterListEmpty}
            </Text>
          </View>
        ) : (
          medicalInfoList.map((person, index) => (
            <ClinicalCard key={index} style={{ flexDirection: "row", gap: 14, alignItems: "center", padding: 14 }}>
              {/* Avatar */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: mobileColors.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: mobileColors.primaryDeep, fontFamily: "Inter_800ExtraBold" }}>
                  {initials(person.firstName, person.lastName)}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: mobileColors.text, fontFamily: "Inter_700Bold" }}>
                    {person.firstName} {person.lastName}
                  </Text>
                  {index === 0 && <Chip label="Titular" tone="primary" />}
                </View>
                <Text style={{ fontSize: 12, color: mobileColors.textSoft, marginTop: 3, fontFamily: "Inter_400Regular" }}>
                  {str.labelAge}: {person.age} {str.unitYears}
                </Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {person.bloodType && (
                    <Chip label={BLOOD_TYPES[person.bloodType] ?? person.bloodType} tone="info" icon="droplet" />
                  )}
                  {(person.diseases ?? []).slice(0, 1).map((d) => (
                    <Chip key={d} label={d} tone="urgent" />
                  ))}
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleEdit(index)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: mobileRadii.sm,
                    backgroundColor: mobileColors.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="edit-2" size={15} color={mobileColors.primaryDeep} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(index)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: mobileRadii.sm,
                    backgroundColor: mobileColors.criticalBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="trash-2" size={15} color={mobileColors.critical} />
                </TouchableOpacity>
              </View>
            </ClinicalCard>
          ))
        )}

        <View style={{ flex: 1 }} />

        {/* Capacity hint */}
        <ClinicalCard
          style={{
            backgroundColor: mobileColors.primaryTint,
            borderStyle: "dashed",
            borderColor: mobileColors.primary,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Feather name="info" size={18} color={mobileColors.primaryDeep} />
          <Text style={{ flex: 1, fontSize: 12, color: mobileColors.primaryDeep, fontWeight: "600", fontFamily: "Inter_600SemiBold" }}>
            Puedes registrar hasta {MAX_REGISTERED_PERSONS} personas ({medicalInfoList.length}/{MAX_REGISTERED_PERSONS}).
          </Text>
        </ClinicalCard>
      </View>
    </View>
  );
}
