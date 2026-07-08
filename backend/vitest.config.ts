import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    // First run downloads/starts an in-memory MongoDB binary — allow headroom.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
