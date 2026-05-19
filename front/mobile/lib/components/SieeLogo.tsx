import React from "react";
import { View, Image } from "react-native";

interface SIEELogoProps {
  size?: number;
}

const SIEELogo = ({ size = 96 }: SIEELogoProps) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={require("@/assets/images/SIEE_logo.jpg")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};

export default SIEELogo;
