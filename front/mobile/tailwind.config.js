/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
    colors: {
      primary: "#257985",
      primarypale: "#b2dbd5",
      primaryshade: "#0d4955",
      danger: "#ff4447",
      dangerpale: "#ffc0c1",
      black: "#232a32",
      white: "#ffffff",
      gray: "#c0c0c0",
    },
  },
  plugins: [],
};
