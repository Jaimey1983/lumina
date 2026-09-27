/**
 * Vitest browser no define `process` (Next usa `process.env` en módulos compartidos).
 * Necesario al importar `SlideRenderer` y hooks de API en specs visuales.
 */
const env = {
  NEXT_PUBLIC_API_URL: 'http://localhost:3000',
};

if (typeof globalThis.process === 'undefined') {
  Object.assign(globalThis, { process: { env } });
} else if (!globalThis.process.env) {
  globalThis.process.env = env as unknown as NodeJS.ProcessEnv;
}
