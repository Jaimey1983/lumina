import { defineConfig } from "vitest/config";

// H1: solo lógica pura (paletas, formato, tema, adapter de opciones de ApexCharts).
// El render real de <LuminaChart> se prueba en H3 (paridad Playwright del elemento
// grafico), igual que ya documenta E4.5/E5.7 para el motor Recharts anterior.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
