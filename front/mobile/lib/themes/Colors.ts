import { Colors } from "@rneui/themed";

export const colors = {
  primary: "#257985",
  secondary: "#b2dbd5",
  background: "#ffffff",
  white: "#ffffff",
  black: "#232a32",
  grey0: "#f5f5f5",
  grey1: "#e0e0e0",
  grey2: "#bdbdbd",
  grey3: "#9e9e9e",
  grey4: "#757575",
  grey5: "#616161",
  greyOutline: "#e0e0e0",
  searchBg: "#f5f5f5",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#ff4447",
  disabled: "#e0e0e0",
  divider: "#e0e0e0",
  border: "#e0e0e0",
  text: "#232a32",
  placeholder: "#9e9e9e",
  surface: "#f8f9fa",
  whiteAlpha: "#ffffffcc",
  overlay: "#000000a0",
  shadowColor: "#000000",
  statusReceived: "#dc2626",
  statusDispatched: "#f97316",
  statusOnRoute: "#FF0000",
  statusClosed: "#6b7280",
  statusOnSiteTwinkle: "#166534",
  twinkle: "#facc15",
};

export const emergencyColors = {
  pending:  { bg: "#faeeda", border: "#ef9f27", text: "#633806" },
  active:   { bg: "#e6f1fb", border: "#185fa5", text: "#185fa5" },
  assigned: { bg: "#eeedfe", border: "#afa9ec", text: "#3c3489" },
  done:     { bg: "#e1f5ee", border: "#6bbeb8", text: "#085041" },
};

// Operator-web specific scheme tokens (match design prototype).
// Each entry includes an `accent` used for the 4px left border on cards and map pins.
export const operatorStatusColors = {
  received: { bg: "#fef5e7", border: "#ef9f27", text: "#7c4a03", accent: "#ef9f27" },
  triaged:  { bg: "#fef2f2", border: "#ef4444", text: "#991b1b", accent: "#ef4444" },
  assigned: { bg: "#eef2ff", border: "#818cf8", text: "#3730a3", accent: "#818cf8" },
  onSite:   { bg: "#ecfdf5", border: "#34d399", text: "#065f46", accent: "#34d399" },
  closed:   { bg: "#f0fdf4", border: "#6bbeb8", text: "#085041", accent: "#6bbeb8" },
};

export const operatorUiColors = {
  primary:      "#257985",
  primaryDark:  "#1c5f69",
  primaryLight: "#eef7f8",
  bg:           "#f5f6f8",
  surface:      "#ffffff",
  text:         "#232a32",
  textSec:      "#6b7280",
  textTer:      "#9ca3af",
  border:       "#e5e7eb",
  borderLight:  "#f0f0f0",
  navBg:        "#1e2736",
  navHover:     "#2d3a4d",
  navActive:    "#364863",
  navIconIdle:  "#8899aa",
  error:        "#ef4444",
  success:      "#22c55e",
};

export const operatorToastTones = {
  emergency: { accent: "#f97316", iconBg: "#fff4e6", iconColor: "#c2410c" },
  success:   { accent: "#257985", iconBg: "#eef7f8", iconColor: "#257985" },
  info:      { accent: "#3b82f6", iconBg: "#eff6ff", iconColor: "#1d4ed8" },
};

export const triageColors = {
  critical: "#ff4447",
  mild:     "#6bbeb8",
};

export const paramedicStatusColors: Record<string, { bg: string; border: string; text: string }> = {
  AVAILABLE:      { bg: "#e1f5ee", border: "#6bbeb8", text: "#085041" },
  ON_ROUTE:       { bg: "#faeeda", border: "#ef9f27", text: "#633806" },
  OUT_OF_SERVICE: { bg: "#f5f5f5", border: "#bdbdbd", text: "#757575" },
};
