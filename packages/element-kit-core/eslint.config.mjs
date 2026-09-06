import base from "../../lumina-frontend/eslint.config.mjs";
import frontend from "../../lumina-frontend/package.json" with { type: "json" };

const config = [
  ...base,
  { ignores: ["dist/**"] },
  { settings: { react: { version: frontend.dependencies.react } } },
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
];

export default config;
