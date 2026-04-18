import type { CSSProperties } from "react";
import { colors } from "@/lib/themes/Colors";

type Variant = "primary" | "outline" | "danger";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: CSSProperties;
}

const base: CSSProperties = {
  padding: "8px 18px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  borderWidth: 1,
  borderStyle: "solid",
  fontFamily: "inherit",
  lineHeight: 1.2,
};

const variants: Record<Variant, CSSProperties> = {
  primary: {
    background: colors.primary,
    color: colors.white,
    borderColor: colors.primary,
  },
  outline: {
    background: colors.white,
    color: colors.primary,
    borderColor: colors.primary,
  },
  danger: {
    background: colors.error,
    color: colors.white,
    borderColor: colors.error,
  },
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: Props) {
  const merged: CSSProperties = {
    ...base,
    ...variants[variant],
    ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
    ...style,
  };
  return (
    <button style={merged} disabled={disabled} onClick={onPress} type="button">
      {title}
    </button>
  );
}
