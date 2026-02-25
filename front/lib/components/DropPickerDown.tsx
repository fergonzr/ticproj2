import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

interface Props {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}

/**
 * Generic dropdown picker component.
 * @param options - List of string options to display.
 * @param selected - Currently selected option.
 * @param onSelect - Callback fired when the user picks an option.
 * @returns ReactElement
 */
export default function DropPickerDown({ options, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setOpen(!open)}
      >
        <Text style={styles.buttonText}>{selected}</Text>
        <Text style={styles.arrow}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.menu}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.item}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={styles.itemText}>{opt}</Text>
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