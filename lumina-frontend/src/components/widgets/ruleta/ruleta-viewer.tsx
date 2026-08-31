'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { RuletaWidget } from '@/types/widget.types';

import { RULETA_EASING, calcularRotacionHastaGanador } from './ruleta-config';
import { normalizeRuletaBlock } from './ruleta-defaults';
import { RuletaWheel } from './ruleta-wheel';

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
    <div className="grid h-full min-h-0 w-full grid-rows-[minmax(0,1fr)_auto] gap-2 p-2">
      <div className="relative min-h-0">
        <RuletaWheel ref={wheelRef} items={items} colores={configuracion.colores} />

        {ganador && (
          <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 max-w-[92%] -translate-x-1/2 rounded-xl border border-yellow-200 bg-yellow-50/95 px-4 py-2 text-center shadow-sm backdrop-blur-sm">
            <p className="text-[10px] font-medium text-yellow-600">¡Ganador!</p>
            <p className="truncate text-sm font-bold text-yellow-800">{ganador}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleGirar}
        disabled={girando}
        className="relative z-20 mx-auto shrink-0 rounded-xl bg-[#2563EB] px-8 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {girando ? 'Girando...' : 'Girar'}
      </button>
    </div>
  );
}
