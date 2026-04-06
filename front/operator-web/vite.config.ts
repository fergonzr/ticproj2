import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolves @/ to the front/ root so we can import from lib/
      "@": path.resolve(__dirname, ".."),
      // @rneui/themed is only used for a Colors type — mock it so Vite doesn't choke
      "@rneui/themed": path.resolve(__dirname, "src/mocks/rneui.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
