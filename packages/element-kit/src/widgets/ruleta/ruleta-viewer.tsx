'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { RuletaWidget } from '@lumina/types/widget';

import { RULETA_EASING, calcularRotacionHastaGanador } from './ruleta-config.js';
import { normalizeRuletaBlock } from './ruleta-defaults.js';
import { RuletaWheel } from './ruleta-wheel.js';

interface RuletaViewerProps {
  block: RuletaWidget;
}

export function RuletaViewer({ block }: RuletaViewerProps) {
  const widget = normalizeRuletaBlock(block);
  const { configuracion, items } = widget;

  const [girando, setGirando] = useState(false);
  const [ganador, setGanador] = useState<string | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const rotacionRef = useRef(0);
  const animRef = useRef<Animation | null>(null);
  const girandoRef = useRef(false);

  useEffect(() => {
    return () => {
      animRef.current?.cancel();
    };
  }, []);

  const handleGirar = useCallback(() => {
    if (girandoRef.current || items.length === 0) return;

    const wheel = wheelRef.current;
    if (!wheel) return;

    animRef.current?.cancel();

    const idxGanador = Math.floor(Math.random() * items.length);
    const desde = rotacionRef.current;
    const destino = calcularRotacionHastaGanador(idxGanador, items.length, desde);

    girandoRef.current = true;
    setGirando(true);
    setGanador(null);

    wheel.style.transform = `rotate(${desde}deg)`;

    const anim = wheel.animate(
      [{ transform: `rotate(${desde}deg)` }, { transform: `rotate(${destino}deg)` }],
      {
        duration: configuracion.duracionGiro,
        easing: RULETA_EASING,
        fill: 'forwards',
      },
    );
    animRef.current = anim;

    void anim.finished
      .then(() => {
        rotacionRef.current = destino;
        wheel.style.transform = `rotate(${destino}deg)`;
        anim.cancel();

        if (configuracion.mostrarGanador) {
          setGanador(items[idxGanador]?.texto ?? null);
        }
      })
      .catch(() => {
        // Animación cancelada (p. ej. desmontaje)
      })
      .finally(() => {
        girandoRef.current = false;
        setGirando(false);
        animRef.current = null;
      });
  }, [items, configuracion.duracionGiro, configuracion.mostrarGanador]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-between gap-3 p-2">
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
        <RuletaWheel ref={wheelRef} items={items} colores={configuracion.colores} />

        {ganador && (
          <div
            className="pointer-events-none absolute bottom-1 left-1/2 z-30 max-w-[92%] -translate-x-1/2 border border-yellow-200 bg-yellow-50/95 px-4 py-2 text-center shadow-lg backdrop-blur-sm"
            style={{
              borderRadius: 'var(--lw-radius-lg, 0.75rem)',
              boxShadow: 'var(--lw-shadow-md, 0 4px 12px rgba(0,0,0,0.1))',
            }}
          >
            <p className="text-[10px] font-medium text-yellow-600">¡Ganador!</p>
            <p
              className="truncate text-sm font-bold text-yellow-800"
              style={{ fontFamily: 'var(--lw-font-family, inherit)' }}
            >
              {ganador}
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleGirar}
        disabled={girando}
        className="relative z-20 mx-auto shrink-0 px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-[0.97] disabled:opacity-50 cursor-pointer"
        style={{
          backgroundColor: 'var(--lw-color-primary, #2563EB)',
          borderRadius: 'var(--lw-radius-lg, 0.75rem)',
        }}
      >
        {girando ? 'Girando...' : 'Girar'}
      </button>
    </div>
  );
}

