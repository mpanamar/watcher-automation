import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "api",
    include: ["tests/api/**/*.test.ts"],
    environment: "node",
  },
});
