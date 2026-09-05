import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const frontendSrc = path.resolve(root, "../../lumina-frontend/src");

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
  },
  css: {
    modules: {
      classNameStrategy: "non-scoped",
    },
  },
  resolve: {
    alias: {
      "@": frontendSrc,
      "lumina-frontend/widgets/boton": path.resolve(
        frontendSrc,
        "components/widgets/boton/index.ts",
      ),
    },
  },
});
