import React from "react";
import { View, Image } from "react-native";
import { colors } from "@/lib/themes/Colors";

interface SIEELogoProps {
  size?: number;
  borderColor?: string;
}

const SIEELogo = ({
  size = 150,
  borderColor = colors.primary,
}: SIEELogoProps) => {
  const imageSize = size * 0.8;

  return (
    <View className="flex flex-row justify-center items-center my-xl">
      <View
        style={{
          width: size,
          height: size,
          borderColor: borderColor,
          borderWidth: 4,
        }}
        className="aspect-square overflow-hidden bg-white border-solid rounded-full"
      >
        <Image
          source={require("@/assets/images/SIEE_logo.jpg")}
          className="rounded-full"
          style={{ margin: "auto", width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default SIEELogo;
