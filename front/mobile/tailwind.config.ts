import {
  mobileColors,
  mobileSpacing,
  mobileRadii,
  mobileTypography,
} from "./lib/themes/mobileTokens";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Legacy tokens — preserved for existing screens. Deletion deferred.
        primary: "#257985",
        primarypale: "#b2dbd5",
        primaryshade: "#0d4955",
        danger: "#ff4447",
        dangerpale: "#ffc0c1",
        black: "#232a32",
        white: "#ffffff",
        gray: "#c0c0c0",
        // New Clinical Teal tokens under `cl` namespace.
        cl: mobileColors,
      },
      spacing: mobileSpacing,
      borderRadius: mobileRadii,
      fontFamily: mobileTypography.family,
      fontSize: mobileTypography.size,
    },
  },
  plugins: [],
};

export default config;
