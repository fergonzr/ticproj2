import SIEELogo from "@/lib/components/SieeLogo";
import { View, Pressable } from "react-native";
import { Text } from "@rneui/themed";
import * as str from "@/lib/strings";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Main() {
  return (
    <SafeAreaView className="flex flex-col align-middle">
      <SIEELogo></SIEELogo>
      <Text h2={true} className="text-center text-red-700">
        {str.emergency}
      </Text>
      <Pressable className="self-center my-6 aspect-square w-4/5 border-solid border-red-700 border-2 rounded-full">
        <Text className="text-red-600 text-center text-4xl my-auto mx-16">
          {str.emergencyBtnInitial}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
