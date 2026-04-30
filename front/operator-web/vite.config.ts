import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      // config.ts uses process.env.EXPO_PUBLIC_LAN_IP — inject it from VITE_LAN_IP
      "process.env.EXPO_PUBLIC_LAN_IP": JSON.stringify(env.VITE_LAN_IP),
    },
    resolve: {
      alias: {
        // Resolves @/ to front/mobile/ so we can import shared lib/
        "@": path.resolve(__dirname, "../mobile"),
        // @rneui/themed is only used for a Colors type — mock it so Vite doesn't choke
        "@rneui/themed": path.resolve(__dirname, "src/mocks/rneui.ts"),
      },
    },
    server: {
      port: 5173,
    },
  };
});
