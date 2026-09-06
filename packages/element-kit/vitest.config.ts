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
      "lumina-frontend/widgets/timeline": path.resolve(frontendSrc, "components/widgets/timeline/index.ts"),
      "lumina-frontend/widgets/click-reveal": path.resolve(frontendSrc, "components/widgets/click-reveal/index.ts"),
      "lumina-frontend/widgets/carousel": path.resolve(frontendSrc, "components/widgets/carousel/index.ts"),
      "lumina-frontend/widgets/tabs": path.resolve(frontendSrc, "components/widgets/tabs/index.ts"),
      "lumina-frontend/widgets/flip-cards": path.resolve(frontendSrc, "components/widgets/flip-cards/index.ts"),
      "@": frontendSrc,
      "lumina-frontend/widgets/boton": path.resolve(
        frontendSrc,
        "components/widgets/boton/index.ts",
      ),
      "lumina-frontend/widgets/ruleta": path.resolve(
        frontendSrc,
        "components/widgets/ruleta/index.ts",
      ),
      "lumina-frontend/widgets/hotspot": path.resolve(
        frontendSrc,
        "components/widgets/hotspot/index.ts",
      ),
      "lumina-frontend/widgets/tooltip": path.resolve(
        frontendSrc,
        "components/widgets/tooltip/index.ts",
      ),
      "lumina-frontend/widgets/contador": path.resolve(
        frontendSrc,
        "components/widgets/contador/index.ts",
      ),
      "lumina-frontend/widgets/progreso": path.resolve(
        frontendSrc,
        "components/widgets/progreso/index.ts",
      ),
      "lumina-frontend/widgets/popup": path.resolve(
        frontendSrc,
        "components/widgets/popup/index.ts",
      ),
      "lumina-frontend/blocks/grafico": path.resolve(
        frontendSrc,
        "components/graficos/index.ts",
      ),
      "lumina-frontend/blocks/diagrama": path.resolve(
        frontendSrc,
        "components/diagramas/index.ts",
      ),
      "lumina-frontend/blocks/clip-group/paper": path.resolve(
        frontendSrc,
        "components/clip-group/paper.ts",
      ),
      "lumina-frontend/blocks/clip-group": path.resolve(
        frontendSrc,
        "components/clip-group/index.ts",
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
      "lumina-frontend/editor-activities": path.resolve(
        frontendSrc,
        "app/(app)/classes/[id]/editor/element-kit-classic.ts",
      ),
    },
  },
});
