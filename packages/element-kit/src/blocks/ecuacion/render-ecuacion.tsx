'use client';

import { Suspense, lazy } from 'react';
import type { EquationBlock } from '@lumina/types/slide';
import type { EquationRuntime } from './equation-view.js';

/** KaTeX (+ CSS) solo se carga cuando hay una ecuación en el slide. */
const EquationViewLazy = lazy(() => import('./equation-view.js'));

export interface RenderEcuacionProps {
  block: EquationBlock;
  modo?: 'editor' | 'viewer';
  /** M2: variables, ajustadores y eventos del motor. Ausente = fórmula estática. */
  runtime?: EquationRuntime;
}

export function RenderEcuacion({ block, modo = 'viewer', runtime }: RenderEcuacionProps) {
  const latex = (block.latex ?? '').trim();
  if (latex === '') {
    if (modo !== 'editor') return null;
    return (
      <div
        data-ecuacion-vacia="1"
        className="box-border flex h-full w-full items-center justify-center text-center"
        style={{
          border: '2px dashed #aaa',
          color: '#999',
          fontSize: 'clamp(10px, 1.6vw, 13px)',
          padding: 4,
        }}
      >
        Ecuación vacía — escríbela en el panel de propiedades
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ fontFamily: 'monospace', fontSize: 14 }}
        >
          {latex}
        </div>
      }
    >
      <EquationViewLazy block={block} modo={modo} runtime={runtime} />
    </Suspense>
  );
}
