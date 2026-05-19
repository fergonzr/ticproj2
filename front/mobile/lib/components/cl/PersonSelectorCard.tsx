import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { MedicalInfo } from "@/lib/models";
import * as str from "@/lib/strings";
import { mobileColors, mobileRadii } from "@/lib/themes/mobileTokens";

interface Props {
  medicalInfoList: MedicalInfo[];
  selectedPersonIndex: number | null;
  onSelect: (index: number | null) => void;
  showThirdPartyOption?: boolean;
  thirdPartyLabel?: string;
}

/**
 * Citizen "Report-for" selector matching the Clinical Teal mockup:
 * rounded card with a left avatar tile, a tiny uppercase label,
 * the selected person's full label, and a trailing chevron.
 * Tapping it opens a modal sheet listing all available identities.
 */
export default function PersonSelectorCard({
  medicalInfoList,
  selectedPersonIndex,
  onSelect,
  showThirdPartyOption = false,
  thirdPartyLabel = str.labelThirdParty,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedPerson =
    selectedPersonIndex !== null && medicalInfoList[selectedPersonIndex]
      ? medicalInfoList[selectedPersonIndex]
      : null;

  const valueText = selectedPerson
    ? `${selectedPerson.firstName} ${selectedPerson.lastName}${
        selectedPerson.age ? ` · ${selectedPerson.age} años` : ""
      }`
    : thirdPartyLabel;

  const handlePick = (index: number | null) => {
    onSelect(index);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: mobileColors.surface,
            borderRadius: mobileRadii.lg,
            borderWidth: 1,
            borderColor: mobileColors.border,
            shadowColor: mobileColors.text,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: mobileColors.primarySoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="user" size={18} color={mobileColors.primaryDeep} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                color: mobileColors.textSoft,
                fontWeight: "600",
                letterSpacing: 0.4,
                textTransform: "uppercase",
                fontFamily: "Inter_600SemiBold",
              }}
            >
              {str.labelReportFor}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: mobileColors.text,
                marginTop: 2,
                fontFamily: "Inter_700Bold",
              }}
              numberOfLines={1}
            >
              {valueText}
            </Text>
          </View>
          <Feather name="chevron-down" size={18} color={mobileColors.textSoft} />
        </View>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(11,22,32,0.45)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: mobileColors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 28,
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: mobileColors.border,
                alignSelf: "center",
                marginBottom: 14,
              }}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: mobileColors.text,
                marginBottom: 4,
                paddingHorizontal: 4,
                fontFamily: "Inter_800ExtraBold",
              }}
            >
              ¿Para quién es la emergencia?
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: mobileColors.textMid,
                marginBottom: 14,
                paddingHorizontal: 4,
                fontFamily: "Inter_400Regular",
              }}
            >
              Selecciona el perfil cuyos datos médicos se compartirán con el paramédico.
            </Text>
            <ScrollView>
              {showThirdPartyOption && (
                <OptionRow
                  active={selectedPersonIndex === null}
                  title={thirdPartyLabel}
                  subtitle="Sin perfil médico vinculado"
                  iconBg={mobileColors.borderSoft}
                  iconColor={mobileColors.textMid}
                  onPress={() => handlePick(null)}
                />
              )}
              {medicalInfoList.map((person, index) => (
                <OptionRow
                  key={index}
                  active={selectedPersonIndex === index}
                  title={`${person.firstName} ${person.lastName}`}
                  subtitle={person.age ? `${person.age} años` : undefined}
                  iconBg={mobileColors.primarySoft}
                  iconColor={mobileColors.primaryDeep}
                  onPress={() => handlePick(index)}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function OptionRow({
  active,
  title,
  subtitle,
  iconBg,
  iconColor,
  onPress,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 12,
          marginBottom: 8,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: active ? mobileColors.primary : mobileColors.border,
          backgroundColor: active ? mobileColors.primaryTint : mobileColors.surface,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="user" size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: mobileColors.text,
              fontFamily: "Inter_700Bold",
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 12,
                color: mobileColors.textSoft,
                marginTop: 2,
                fontFamily: "Inter_400Regular",
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: active ? mobileColors.primary : mobileColors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {active && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: mobileColors.primary,
              }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
