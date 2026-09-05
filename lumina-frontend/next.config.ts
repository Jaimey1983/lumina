import type { NextConfig } from "next";
import path from "node:path";

/** App Next independiente: no usar el lockfile residual de la raíz del monorepo. */
const frontendRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: frontendRoot,
  turbopack: {
    root: frontendRoot,
  },
  serverExternalPackages: ['paper'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  eslint: {
    // `next build` no bloquea por lint: hay violaciones pre-existentes en el
    // repo (react-hooks/purity, static-components, no-img-element…). ESLint
    // vuelve a funcionar para `npm run lint` tras arreglar la resolución de
    // `brace-expansion` (ver overrides en package.json).
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
