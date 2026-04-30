import { ReactElement } from "react";
import { ScrollView, Text, View } from "react-native";
import * as str from "@/lib/strings";
import SIEELogo from "@/lib/components/SieeLogo";

export default function AboutUs(): ReactElement {
  return (
    <ScrollView className="flex flex-col align-middle">
      <View className="h-4"></View>
      <SIEELogo></SIEELogo>
      <Text className="text-primary text-4xl mt-10 font-bold text-center">
        {str.aboutUsTitle}
      </Text>
      <View className="rounded-2xl border-2 my-10 mx-20 px-10 py-5 flex flex-col gap-4">
        <Text className="text-xl text-center">{str.aboutUsDescription}</Text>
        <View>
          <Text className="text-xl text-center font-bold">
            {str.aboutUsContact}
          </Text>
          <Text className="text-xl text-center">{str.aboutUsPhoneNumber}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
