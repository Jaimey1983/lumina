import base from "../../lumina-frontend/eslint.config.mjs";

const config = [...base, { ignores: ["dist/**"] }];

export default config;
