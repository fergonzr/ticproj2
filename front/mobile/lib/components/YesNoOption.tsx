import { View } from "react-native";
import RadioOption from "@/lib/components/RadioOption";
import * as str from "@/lib/strings";

interface Props {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

/**
 * A pair of Yes/No radio buttons bound to a boolean field.
 * @param value - Current boolean value (null means nothing selected yet).
 * @param onChange - Callback with the new boolean value.
 */
export default function YesNoOption({ value, onChange }: Props) {
  return (
    <View className="flex-row">
      <RadioOption
        label={str.optionYes}
        selected={value === true}
        onPress={() => onChange(true)}
      />
      <RadioOption
        label={str.optionNo}
        selected={value === false}
        onPress={() => onChange(false)}
      />
    </View>
  );
}
