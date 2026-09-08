import { defineConfig } from "vitest/config";

// Los 4 *.spec.ts de widgets/shared son puros (vitest + tipos, sin render).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
