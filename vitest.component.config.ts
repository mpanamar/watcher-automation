import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  envDir: process.cwd(),
  test: {
    name: "component",
    include: ["tests/component/**/*.test.tsx"],
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000/",
      },
    },
    setupFiles: ["tests/component/setup.ts"],
  },
});
