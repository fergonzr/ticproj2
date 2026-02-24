import { Input } from "@rneui/themed";
import { View, Text } from "react-native";
import * as str from "@/lib/strings";
import "../global.css";
import { ReactElement } from "react";

/**
 * Screen to allow a Citizen to register its medical info.
 * @returns ReactElement
 */
export default function MedicalRegister(): ReactElement {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Input label={<Text>{str.labelName}</Text>} placeholder="Salomé"></Input>
      <Input
        label={<Text>{str.labelLastName}</Text>}
        placeholder="Pulgarín"
      ></Input>
      <Input
        autoComplete="tel"
        label={<Text>{str.labelPhone}</Text>}
        placeholder="3121234567"
      ></Input>
      <Input
        label={<Text>{str.labelIDType}</Text>}
        placeholder="Salomé"
      ></Input>
      <Input label={<Text>{str.labelID}</Text>} placeholder="Salomé"></Input>
    </View>
  );
}
