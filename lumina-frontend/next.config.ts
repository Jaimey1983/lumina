import type { NextConfig } from "next";
import path from "node:path";

/**
 * Raíz del workspace pnpm real (E1.1). El `next.config` vivía apuntando a
 * `__dirname` porque antes la raíz solo tenía un `pnpm-workspace.yaml` residual;
 * hoy la raíz ES el workspace (único `pnpm-lock.yaml`) y `next` está hoisteado
 * ahí. Turbopack con `root` en `lumina-frontend/` no podía resolver `next`
 * fuera de ese `root` → "Next.js package not found". Debe apuntar a la raíz.
 */
const workspaceRoot = path.resolve(__dirname, "..");

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  serverExternalPackages: ['paper'],
  // Paquetes internos del workspace que se consumen desde fuente TS (E2).
  transpilePackages: ['@lumina/scoring'],
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
