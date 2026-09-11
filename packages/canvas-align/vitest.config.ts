import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// G0: lógica pura (node). G1: <AlignmentOverlay> (.spec.tsx, jsdom + testing-library).
// jsdom global sirve para ambos — los .spec.ts puros no dependen del DOM.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
  },
});
