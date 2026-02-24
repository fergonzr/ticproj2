import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";
// import styles from '../../front/src/core/presentation/styles/AppButton.styles';

type ButtonVariant = "outlined" | "filled" | "cancel";

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
}

const AppButton = ({
  title,
  variant = "outlined",
  ...props
}: AppButtonProps) => {
  const buttonStyle = [styles.base, styles[variant]];
  const textStyle =
    variant === "filled"
      ? styles.textFilled
      : variant === "cancel"
        ? styles.textCancel
        : styles.textOutlined;

  return (
    <TouchableOpacity style={buttonStyle} {...props}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AppButton;
