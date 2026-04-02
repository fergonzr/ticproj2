import { View, Text } from "react-native";
import { styles } from "@/lib/styles/operator/Topbar.styles";
import * as str from "@/lib/strings";

interface Props {
  operatorName: string;
}

export default function Topbar({ operatorName }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{str.operatorDashboardTitle}</Text>
      <Text style={styles.operatorName}>{operatorName}</Text>
    </View>
  );
}
