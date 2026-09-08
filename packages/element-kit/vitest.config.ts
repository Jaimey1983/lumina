import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));
const frontendSrc = path.resolve(root, "../../lumina-frontend/src");
const elementKitCoreSrc = path.resolve(root, "../element-kit-core/src/index.ts");

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
    setupFiles: ["./src/vitest-setup.ts"],
    // 30s: los `*.parity.spec.tsx` que hacen `await import("../../index.js")`
    // pagan el coste de registrar los 45 elementos (Recharts, @xyflow, Paper);
    // bajo carga (`pnpm -r test`) los 15s daban flake recurrente en grafico.
    testTimeout: 30_000,
  },
  css: {
    modules: {
      classNameStrategy: "non-scoped",
    },
  },
  resolve: {
    alias: {
      "@lumina/element-kit-core": elementKitCoreSrc,
      "@lumina/ui": path.resolve(root, "../ui/src"),
      "@lumina/editor-shared": path.resolve(root, "../editor-shared/src"),
      "@lumina/types/slide": path.resolve(root, "../types/src/slide.types.ts"),
      "@lumina/types/widget": path.resolve(root, "../types/src/widget.types.ts"),
      "@lumina/types/animation": path.resolve(root, "../types/src/animation.types.ts"),
      "@lumina/types/autonomous": path.resolve(root, "../types/src/autonomous.types.ts"),
      "@lumina/types/curriculum": path.resolve(root, "../types/src/curriculum.types.ts"),
      "@": frontendSrc,
      "lumina-frontend/blocks/texto": path.resolve(
        frontendSrc,
        "components/primitives/texto/index.ts",
      ),
      "lumina-frontend/blocks/imagen": path.resolve(
        frontendSrc,
        "components/primitives/imagen/index.ts",
      ),
      "lumina-frontend/blocks/video": path.resolve(
        frontendSrc,
        "components/primitives/video/index.ts",
      ),
      "lumina-frontend/blocks/audio": path.resolve(
        frontendSrc,
        "components/primitives/audio/index.ts",
      ),
      "lumina-frontend/blocks/codigo": path.resolve(
        frontendSrc,
        "components/primitives/codigo/index.ts",
      ),
      "lumina-frontend/blocks/cita": path.resolve(
        frontendSrc,
        "components/primitives/cita/index.ts",
      ),
      "lumina-frontend/blocks/separador": path.resolve(
        frontendSrc,
        "components/primitives/separador/index.ts",
      ),
      "lumina-frontend/blocks/columnas": path.resolve(
        frontendSrc,
        "components/primitives/columnas/index.ts",
      ),
    },
  },
});
