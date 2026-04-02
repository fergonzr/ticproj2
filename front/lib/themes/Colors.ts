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
  AVAILABLE:       { bg: "#e1f5ee", border: "#6bbeb8", text: "#085041" },
  ON_ROUTE:        { bg: "#faeeda", border: "#ef9f27", text: "#633806" },
  OUT_OF_SERVICE:  { bg: "#f5f5f5", border: "#bdbdbd", text: "#757575" },
};

/** Dark-theme tokens used exclusively by the operator web dashboard. */
export const op = {
  // Backgrounds
  bg:          "#0d1117",
  surface:     "#161b22",
  card:        "#1c2128",
  cardActive:  "#22272e",

  // Borders
  border:      "#30363d",
  borderSub:   "#21262d",

  // Brand accent (teal)
  accent:      "#2dd4bf",
  accentDim:   "#14b8a6",

  // Text
  textPrimary:   "#e6edf3",
  textSecondary: "#8b949e",
  textMuted:     "#6e7681",

  // Status
  critical:  "#f85149",
  warning:   "#e3b341",
  success:   "#3fb950",
  info:      "#58a6ff",
  purple:    "#a371f7",
};

/** Emergency status → accent color used in operator cards and map markers. */
export const opEmergencyAccent: Record<string, string> = {
  RECEIVED:    "#e3b341",
  TRIAGED:     "#e3b341",
  ASSIGNED:    "#a371f7",
  ON_SITE:     "#58a6ff",
  IN_TRANSFER: "#58a6ff",
  CLOSED:      "#30363d",
  CANCELED:    "#30363d",
};

/** Paramedic status colors for dark operator theme. */
export const opParamedicStatus: Record<string, { dot: string; text: string; bg: string }> = {
  AVAILABLE:      { dot: "#3fb950", text: "#3fb950", bg: "rgba(63,185,80,0.12)" },
  ON_ROUTE:       { dot: "#e3b341", text: "#e3b341", bg: "rgba(227,179,65,0.12)" },
  OUT_OF_SERVICE: { dot: "#8b949e", text: "#8b949e", bg: "rgba(139,148,158,0.12)" },
};
