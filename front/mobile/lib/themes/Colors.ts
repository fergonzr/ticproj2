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

export const triageColors = {
  critical: "#ff4447",
  mild:     "#6bbeb8",
};

export const paramedicStatusColors: Record<string, { bg: string; border: string; text: string }> = {
  AVAILABLE:      { bg: "#e1f5ee", border: "#6bbeb8", text: "#085041" },
  ON_ROUTE:       { bg: "#faeeda", border: "#ef9f27", text: "#633806" },
  OUT_OF_SERVICE: { bg: "#f5f5f5", border: "#bdbdbd", text: "#757575" },
};
