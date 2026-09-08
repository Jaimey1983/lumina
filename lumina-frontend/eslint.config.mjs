import { defineConfig } from "eslint/config";
import base from "../eslint.config.base.mjs";

export default defineConfig([
  ...base,
  // Aserciones BDD de Chai (`expect(x).to.exist`) son getters, no llamadas a
  // función — chocan con esta regla genérica sin ser código sin efecto real.
  {
    files: ["cypress/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  // La augmentación de `Cypress.Chainable` requiere ambient `declare
  // namespace` — es el mecanismo documentado por Cypress, no hay
  // equivalente en sintaxis de módulos ES para fusionar esta interfaz global.
  {
    files: ["cypress/support/commands.ts"],
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  },
]);
