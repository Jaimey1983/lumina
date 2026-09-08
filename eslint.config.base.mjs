import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Config eslint base del workspace. La comparten `lumina-frontend` y los
 * paquetes `@lumina/*` (E7.7, 2026-09-07 — antes cada paquete importaba
 * `../../lumina-frontend/eslint.config.mjs`, el último `packages → frontend`).
 *
 * Es `eslint-config-next` (core-web-vitals + typescript) + un par de overrides.
 * En los paquetes deja el warning benigno «Pages directory cannot be found»
 * del plugin `@next/next` — sin efecto (0 errores).
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Paquetes del workspace:
    "dist/**",
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
]);
