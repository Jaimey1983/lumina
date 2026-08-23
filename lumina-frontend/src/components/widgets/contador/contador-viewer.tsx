'use client';

import { useEffect, useRef, useState } from 'react';
import type { ContadorWidget } from '@/types/widget.types';
import { useSlideNav } from '@/components/widgets/shared/slide-nav-context';
import { mergedContadorConfig } from './contador-config';
import { ContadorParts } from './contador-parts';

interface ContadorViewerProps {
  block: ContadorWidget;
  isThumbnail?: boolean;
}

export function ContadorViewer({ block, isThumbnail = false }: ContadorViewerProps) {
  const cfg = mergedContadorConfig(block);
  const { navigate } = useSlideNav();
  const initialMs = cfg.modo === 'temporizador' ? cfg.segundos * 1000 : 0;
  const [ms, setMs] = useState(initialMs);
  const [number, setNumber] = useState(cfg.valorInicial);
  const [running, setRunning] = useState(
    !isThumbnail && cfg.autoIniciar && cfg.modo !== 'numero',
  );
  const endedRef = useRef(false);
  const ranRef = useRef(false);

  useEffect(() => {
    setMs(cfg.modo === 'temporizador' ? cfg.segundos * 1000 : 0);
    setNumber(cfg.valorInicial);
    setRunning(!isThumbnail && cfg.autoIniciar && cfg.modo !== 'numero');
    endedRef.current = false;
    ranRef.current = false;
  }, [cfg.modo, cfg.segundos, cfg.valorInicial, cfg.autoIniciar, isThumbnail]);

  useEffect(() => {
    if (!running || isThumbnail || cfg.modo === 'numero') return;
    ranRef.current = true;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setMs((prev) => {
        if (cfg.modo === 'temporizador') return Math.max(0, prev - dt);
        return prev + dt;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [running, isThumbnail, cfg.modo]);

  useEffect(() => {
    if (cfg.modo !== 'temporizador' || isThumbnail) return;
    if (ms > 0 || endedRef.current || !ranRef.current) return;
    endedRef.current = true;
    setRunning(false);
    // En clase en vivo `navigate` es null: el docente controla el avance.
    if (cfg.alTerminar === 'siguiente' && navigate) {
      navigate({ kind: 'siguiente' });
    }
  }, [ms, cfg.modo, cfg.alTerminar, navigate, isThumbnail]);

  const displaySeconds = ms / 1000;
  const ended = cfg.modo === 'temporizador' && ranRef.current && ms <= 0 && !isThumbnail;

  const handleReset = () => {
    endedRef.current = false;
    ranRef.current = false;
    if (cfg.modo === 'numero') {
      setNumber(cfg.valorInicial);
      return;
    }
    setMs(cfg.modo === 'temporizador' ? cfg.segundos * 1000 : 0);
    setRunning(false);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full items-center justify-center">
      <ContadorParts
        block={block}
        displaySeconds={displaySeconds}
        displayNumber={number}
        running={running}
        ended={ended}
        showControls={!isThumbnail && cfg.mostrarControles}
        onToggleRunning={() => {
          if (cfg.modo === 'temporizador' && ms <= 0) return;
          setRunning((v) => !v);
        }}
        onReset={handleReset}
        onStep={(delta) => setNumber((n) => n + delta)}
      />
    </div>
  );
}
