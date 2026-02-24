import React from "react";
import { View, Image } from "react-native";
import styles from "@/lib/styles/SieeLogo.styles";
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
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 3,
            borderColor,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/SIEE_logo.jpg")}
          style={{ width: imageSize, height: imageSize }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default SIEELogo;
