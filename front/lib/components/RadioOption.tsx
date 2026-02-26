import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Single radio button option.
 * @param label - Text shown next to the radio circle.
 * @param selected - Whether this option is currently selected.
 * @param onPress - Callback fired when the user taps the option.
 * @returns ReactElement
 */
export default function RadioOption({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={[styles.outer, selected && styles.outerSelected]}>
        {selected && <View style={styles.inner} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  outer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  outerSelected: {
    borderColor: colors.primary,
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontSize: 14,
  },
});