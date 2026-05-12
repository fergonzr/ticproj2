/**
 * Clinical Teal design tokens for the SIEE mobile app.
 * Source of truth — consumed by Tailwind config and (later) by RNEUI/Navigation themes.
 * Additive: legacy tokens in Colors.ts remain untouched.
 */

export const mobileColors = {
  // Brand / surface
  primary: "#0E6B78",
  primaryDeep: "#084650",
  primarySoft: "#E6F2F4",
  primaryTint: "#F4F9FA",
  bg: "#F4F6F8",
  surface: "#FFFFFF",
  border: "#E6EAEE",
  borderSoft: "#F0F2F5",

  // Typography
  text: "#0B1620",
  textMid: "#4A5563",
  textSoft: "#7A8794",

  // Triage (semantic)
  critical: "#E03131",
  criticalBg: "#FFE9E9",
  urgent: "#E08C1A",
  urgentBg: "#FFF3DD",
  mild: "#1A8F5A",
  mildBg: "#E1F5EA",

  // Info status
  blue: "#1F6FB8",
  blueBg: "#E7F0FB",
} as const;

export const mobileSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const mobileRadii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const mobileTypography = {
  family: {
    sans: ["Inter_400Regular"],
    medium: ["Inter_500Medium"],
    semibold: ["Inter_600SemiBold"],
    bold: ["Inter_700Bold"],
    extrabold: ["Inter_800ExtraBold"],
    black: ["Inter_900Black"],
  },
  size: {
    xs: 11,
    sm: 12,
    base: 13,
    md: 15,
    lg: 17,
    xl: 24,
    "2xl": 46,
  },
} as const;

export type MobileColors = typeof mobileColors;
export type MobileColorToken = keyof MobileColors;
