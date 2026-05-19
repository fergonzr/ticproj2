import type { CSSProperties } from "react";
import { useState } from "react";
import { operatorUiColors as U } from "@/lib/themes/Colors";
import NavIcon, { type NavIconType } from "./NavIcon";

type Variant = "primary" | "outline" | "danger" | "ghost";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: NavIconType;
  fullWidth?: boolean;
  style?: CSSProperties;
}

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  transition: "all .15s",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  lineHeight: 1.2,
};

const variants: Record<Variant, CSSProperties> = {
  primary: { background: U.primary, color: "#fff" },
  outline: { background: U.surface, color: U.primary, border: `1.5px solid ${U.primary}` },
  danger:  { background: "#fef2f2", color: U.error, border: `1.5px solid ${U.error}` },
  ghost:   { background: "transparent", color: U.textSec },
};

const hovered: Record<Variant, CSSProperties> = {
  primary: { background: U.primaryDark },
  outline: { background: U.primaryLight },
  danger:  { background: "#fee2e2" },
  ghost:   { background: U.primaryLight },
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  icon,
  fullWidth = false,
  style,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const merged: CSSProperties = {
    ...base,
    ...variants[variant],
    ...(isHovered && !disabled ? hovered[variant] : {}),
    ...(fullWidth ? { width: "100%" } : {}),
    ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}),
    ...style,
  };
  return (
    <button
      style={merged}
      disabled={disabled}
      onClick={onPress}
      type="button"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon && <NavIcon type={icon} size={15} />}
      {title}
    </button>
  );
}
