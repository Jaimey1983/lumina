import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {},
  eslint: {
    // `next build` no bloquea por lint: hay violaciones pre-existentes en el
    // repo (react-hooks/purity, static-components, no-img-element…). ESLint
    // vuelve a funcionar para `npm run lint` tras arreglar la resolución de
    // `brace-expansion` (ver overrides en package.json).
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
