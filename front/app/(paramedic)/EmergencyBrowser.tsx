import { ReactElement } from "react";
import { Text, View } from 'react-native';

/**
 * Screen to receive emergencies and manage those currently assigned to the Paramedic user.
 *
 * @returns ReactElement
 */
export default function EmergencyBrowser(): ReactElement {
  return <>
   <View>
      <Text style={{ fontSize: 32, fontWeight: 'bold' }}>Emergency Browser</Text>
    </View>
  </>;
}
