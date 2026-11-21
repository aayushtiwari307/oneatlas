import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: [
      ...(runDatabaseTests ? [] : ["tests/integration/**"]),
      "node_modules/**",
      ".next/**",
    ],
  },
});
