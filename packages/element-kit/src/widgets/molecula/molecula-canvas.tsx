'use client';

import { useEffect, useRef, useState } from 'react';

import { loadSmilesDrawer } from './load-smiles-drawer.js';

export function MoleculaSmilesCanvas({
  smiles,
  heightPx,
  className,
}: {
  smiles: string;
  heightPx: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    setError(null);

    void loadSmilesDrawer().then((SmilesDrawer) => {
      if (cancelled) return;
      const trimmed = smiles.trim();
      if (!trimmed) {
        setError('SMILES vacío');
        return;
      }

      const width = canvas.clientWidth || 400;
      const height = heightPx;
      canvas.width = width;
      canvas.height = height;

      const drawer = new SmilesDrawer.Drawer({ width, height });
      SmilesDrawer.parse(
        trimmed,
        (tree: unknown) => {
          if (cancelled || !canvasRef.current) return;
          try {
            drawer.draw(tree, canvasRef.current, 'light', true);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo dibujar');
          }
        },
        (err: Error) => {
          setError(err?.message ?? 'SMILES no válido');
        },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [smiles, heightPx]);

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: heightPx, display: 'block' }}
      aria-hidden={!smiles.trim()}
    />
  );
}
