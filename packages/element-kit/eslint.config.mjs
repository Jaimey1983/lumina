import base from "../../lumina-frontend/eslint.config.mjs";

const config = [
  ...base,
  { ignores: ["dist/**"] },
  // Este paquete es una biblioteca React, no contiene rutas de Next.js.
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
];

export default config;
