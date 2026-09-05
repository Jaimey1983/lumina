import base from "../../lumina-frontend/eslint.config.mjs";
import frontend from "../../lumina-frontend/package.json" with { type: "json" };

const config = [
  ...base,
  { ignores: ["dist/**"] },
  // La configuración heredada usa React; scoring no lo instala ni lo consume.
  { settings: { react: { version: frontend.dependencies.react } } },
  // Este paquete es una biblioteca, no contiene rutas de Next.js.
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
];

export default config;
