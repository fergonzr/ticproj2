import React from "react";
import { View, Text } from "react-native";
import { MedicalInfo } from "@/lib/models";
import DropdownPicker from "@/lib/components/DropdownPicker";
import * as str from "@/lib/strings";

interface PersonSelectorProps {
  medicalInfoList: MedicalInfo[];
  selectedPersonIndex: number | null;
  onSelect: (index: number | null) => void;
  label?: string;
  showThirdPartyOption?: boolean;
  thirdPartyLabel?: string;
}

export default function PersonSelector({
  medicalInfoList,
  selectedPersonIndex,
  onSelect,
  label = str.labelSelectPerson,
  showThirdPartyOption = false,
  thirdPartyLabel = str.labelThirdParty,
}: PersonSelectorProps) {
  // Create person options for dropdown
  const personOptions = medicalInfoList.map((person, index) => ({
    key: index.toString(),
    label: `${person.firstName} ${person.lastName}`,
  }));

  // Build all options based on configuration
  let allOptions = [...personOptions];

  if (showThirdPartyOption) {
    allOptions = [{ key: "third-party", label: thirdPartyLabel }, ...allOptions];
  }

  // Determine current selected key
  let selectedKey: string = "third-party"; // Default to third party if available

  if (selectedPersonIndex !== null && medicalInfoList.length > 0) {
    selectedKey = selectedPersonIndex.toString();
  } else if (!showThirdPartyOption) {
    selectedKey = medicalInfoList.length > 0 ? "0" : "";
  }

  const handleSelect = (key: string) => {
    if (key === "third-party") {
      onSelect(null);
    } else {
      onSelect(parseInt(key, 10));
    }
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
      <Text style={{ width: 120, color: "#333333", fontSize: 14 }}>{label}</Text>
      <View style={{ flex: 1 }}>
        <DropdownPicker
          options={allOptions.map((opt) => opt.key)}
          displayValues={Object.fromEntries(
            allOptions.map((opt) => [opt.key, opt.label]),
          )}
          selected={selectedKey}
          onSelect={handleSelect}
        />
      </View>
    </View>
  );
}
