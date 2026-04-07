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
]);

export default eslintConfig;
