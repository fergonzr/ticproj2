import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";



interface Props {
  /** List of option keys (e.g. "O_POSITIVE", "NATIONAL_ID") */
  options: string[];
  /**
   * Optional map from key → display label.
   * When provided, the picker shows the label but calls onSelect with the key.
   * When omitted, keys are used directly as display labels (backwards-compatible).
   */
  displayValues?: Record<string, string>;
  /** Currently selected key */
  selected: string;
  /** Callback fired with the selected key */
  onSelect: (key: string) => void;
}


/**
 * Generic dropdown picker component.
 * @param options - List of string options to display.
 * @param selected - Currently selected option.
 * @param onSelect - Callback fired when the user picks an option.
 * @returns ReactElement
 */
export default function DropPickerDown({ options,
  displayValues,
  selected,
  onSelect, }: Props) {
  const [open, setOpen] = useState(false);

  const getLabel = (key: string): string =>
    displayValues ? (displayValues[key] ?? key) : key;

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={() => setOpen(!open)}>
        <Text style={styles.buttonText}>{getLabel(selected)}</Text>
        <Text style={styles.arrow}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.menu}>
          {options.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.item}
              onPress={() => {
                onSelect(key);
                setOpen(false);
              }}
            >
              <Text style={styles.itemText}>{getLabel(key)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
  },
  arrow: {
    color: colors.placeholder,
    marginLeft: spacing.sm,
  },
  menu: {
    position: "absolute",
    top: 38,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    zIndex: 10,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemText: {
    color: colors.text,
    fontSize: 14,
  },
});