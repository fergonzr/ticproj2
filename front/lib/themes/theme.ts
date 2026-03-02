import { colors } from "@/lib/themes/Colors";
import { spacing } from "@/lib/themes/Spacing";
import { createTheme } from "@rneui/themed";
import { Theme, DefaultTheme } from "@react-navigation/native";

export const rneuiTheme = createTheme({
  lightColors: {
    ...colors,
  },
  mode: "light",
  spacing: {
    ...spacing,
  },
  components: {
    Button: {
      raised: true,
    },
  },
});

export const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.white,
    text: colors.black,
    border: colors.greyOutline,
    notification: colors.searchBg,
  },
  dark: rneuiTheme.mode === "dark",
};
