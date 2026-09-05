import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // React Compiler rules that conflict with existing patterns in this codebase.
  // react-hooks/refs: canvas-editor.tsx uses ref mutation during render (lazy init pattern).
  // react-hooks/set-state-in-effect: viewer-client uses setState inside socket event callbacks
  //   registered within useEffect (async, not truly synchronous — but the rule fires anyway).
  {
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // TODO(migración-etapa-5): `canvas-area.tsx` concentra los diagnósticos del
  // React Compiler que la Etapa 5 resuelve al centralizar el estado del editor
  // (reducer central, persistencia/historial por diferencia — ver «Tablero de
  // pasos» → E5 en la raíz `AGENTS.md`): hook llamado condicionalmente,
  // memoización manual no preservable, y mutación de un ref recibido por prop.
  // Tocar el motor del canvas antes de E5 es más riesgo que beneficio, así que
  // hasta entonces estos se degradan a `warn` SOLO en este archivo para no
  // bloquear el CI. Quitar este bloque al cerrar E1.4 → E5.
  {
    files: ["**/editor/components/canvas-area.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
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

export default eslintConfig;
