import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  root: "src/web",
  publicDir: "public",
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        bypass(req) {
          const path = req.url?.split("?")[0] ?? "";
          if (/\.(ts|tsx|js|jsx|mjs|cjs)(\?|$)/.test(path)) {
            return path;
          }
        },
      },
    },
  },
});
