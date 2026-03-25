import React, { ReactElement, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";
import * as str from "@/lib/strings";

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

export default function TagComboInput({
  values,
  onChange,
  suggestions,
  placeholder,
}: Props): ReactElement {
  const [inputText, setInputText] = useState<string>("");
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

  const filteredSuggestions =
    inputText.trim().length > 0
      ? suggestions.filter(
          (s) =>
            s.toLowerCase().includes(inputText.trim().toLowerCase()) &&
            !values.some((v) => v.toLowerCase() === s.toLowerCase()),
        )
      : [];

  function handleChangeText(text: string): void {
    setInputText(text);
    setDropdownVisible(text.trim().length > 0);
  }

  function handleAddText(): void {
    const trimmed = inputText.trim();
    if (!trimmed || values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setInputText("");
      setDropdownVisible(false);
      return;
    }
    onChange([...values, trimmed]);
    setInputText("");
    setDropdownVisible(false);
  }

  function handleSelectSuggestion(suggestion: string): void {
    if (values.some((v) => v.toLowerCase() === suggestion.toLowerCase())) return;
    onChange([...values, suggestion]);
    setInputText("");
    setDropdownVisible(false);
  }

  function handleRemoveTag(tag: string): void {
    onChange(values.filter((v) => v !== tag));
  }

  return (
    <View style={styles.container}>
      {/* Tag list */}
      {values.length > 0 && (
        <View className="flex-row flex-wrap mb-2">
          {values.map((tag) => (
            <View key={tag} style={styles.tag} className="flex-row items-center">
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.removeBtn}>
                <Text style={styles.removeText}>{str.btnTagRemove}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input row */}
      <View className="flex-row items-center">
        <TextInput
          style={styles.input}
          className="flex-1"
          value={inputText}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={handleAddText}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddText}>
          <Text style={styles.addBtnText}>{str.btnTagAdd}</Text>
        </TouchableOpacity>
      </View>

      {/* Inline suggestions dropdown */}
      {dropdownVisible && filteredSuggestions.length > 0 && (
        <View style={styles.dropdown}>
          {filteredSuggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={styles.dropdownItem}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <Text style={styles.dropdownItemText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  tag: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    color: colors.primary,
    fontSize: 14,
  },
  removeBtn: {
    marginLeft: spacing.xs,
  },
  removeText: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 18,
  },
  input: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  addBtnText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "600",
  },
  dropdown: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 14,
  },
});
