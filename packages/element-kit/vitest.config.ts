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
    setupFiles: ["./src/vitest-setup.ts"],
    testTimeout: 15_000,
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
      "lumina-frontend/activities/anagrama": path.resolve(
        frontendSrc,
        "components/activities/anagrama/index.ts",
      ),
      "lumina-frontend/activities/clasificar": path.resolve(
        frontendSrc,
        "components/activities/clasificar/index.ts",
      ),
      "lumina-frontend/activities/memoria": path.resolve(
        frontendSrc,
        "components/activities/memoria/index.ts",
      ),
      "lumina-frontend/activities/puzzle-imagen": path.resolve(
        frontendSrc,
        "components/activities/puzzle-imagen/index.ts",
      ),
      "lumina-frontend/activities/sopa-letras": path.resolve(
        frontendSrc,
        "components/activities/sopa-letras/index.ts",
      ),
      "lumina-frontend/activities/crucigrama": path.resolve(
        frontendSrc,
        "components/activities/crucigrama/index.ts",
      ),
      "lumina-frontend/activities/abrir-caja": path.resolve(
        frontendSrc,
        "components/activities/abrir-caja/index.ts",
      ),
      "lumina-frontend/activities/ahorcado": path.resolve(
        frontendSrc,
        "components/activities/ahorcado/index.ts",
      ),
      "lumina-frontend/activities/puzzle-palabras": path.resolve(
        frontendSrc,
        "components/activities/puzzle-palabras/index.ts",
      ),
      "lumina-frontend/activities/globos": path.resolve(
        frontendSrc,
        "components/activities/globos/index.ts",
      ),
      "lumina-frontend/activities/topo": path.resolve(
        frontendSrc,
        "components/activities/topo/index.ts",
      ),
      "lumina-frontend/activities/historia-ramificada": path.resolve(
        frontendSrc,
        "components/activities/historia-ramificada/index.ts",
      ),
    },
  },
});
