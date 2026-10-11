'use client';

import { useEffect, useRef, useState } from 'react';
import type { EventoTipo } from '@lumina/types/interaction';
import type { ContadorWidget } from '@lumina/types/widget';
import { useSlideNav } from '@lumina/editor-shared/slide-nav-context';
import { formatContadorTime, hitosAlcanzados, mergedContadorConfig } from './contador-config.js';
import { sonarHito } from './contador-sound.js';
import { ContadorParts } from './contador-parts.js';

interface ContadorViewerProps {
  block: ContadorWidget;
  isThumbnail?: boolean;
  /** Etapa K / K3: avisa al motor de interacción. Sin él, el contador se comporta como siempre. */
  emitir?: (evento: EventoTipo) => void;
}

export function ContadorViewer({ block, isThumbnail = false, emitir }: ContadorViewerProps) {
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
  const hitosDisparados = useRef(new Set<number>());
  const [hitoActivo, setHitoActivo] = useState<string | null>(null);

  useEffect(() => {
    setMs(cfg.modo === 'temporizador' ? cfg.segundos * 1000 : 0);
    setNumber(cfg.valorInicial);
    setRunning(!isThumbnail && cfg.autoIniciar && cfg.modo !== 'numero');
    endedRef.current = false;
    ranRef.current = false;
    hitosDisparados.current = new Set();
    setHitoActivo(null);
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

  // T10 — hitos: cada uno avisa una sola vez (destello y/o sonido según `hitosAlerta`).
  useEffect(() => {
    if (isThumbnail || cfg.modo === 'numero' || cfg.hitos.length === 0 || !ranRef.current) return;
    const nuevos = hitosAlcanzados(cfg.modo, ms / 1000, cfg.hitos, cfg.segundos).filter(
      (i) => !hitosDisparados.current.has(i),
    );
    if (nuevos.length === 0) return;
    nuevos.forEach((i) => hitosDisparados.current.add(i));
    const ultimo = cfg.hitos[nuevos[nuevos.length - 1]];
    setHitoActivo(ultimo.etiqueta || formatContadorTime(ultimo.segundos, cfg.formato));
    if (cfg.hitosAlerta !== 'visual') sonarHito(false);
  }, [ms, isThumbnail, cfg.modo, cfg.hitos, cfg.segundos, cfg.formato, cfg.hitosAlerta]);

  useEffect(() => {
    if (!hitoActivo) return;
    const id = window.setTimeout(() => setHitoActivo(null), 2500);
    return () => window.clearTimeout(id);
  }, [hitoActivo]);

  useEffect(() => {
    if (cfg.modo !== 'temporizador' || isThumbnail) return;
    if (ms > 0 || endedRef.current || !ranRef.current) return;
    endedRef.current = true;
    setRunning(false);
    setHitoActivo(null);
    if (cfg.hitosAlerta !== 'visual') sonarHito(true);
    emitir?.('fin_contador');
    // Con runtime, `alTerminar: 'siguiente'` es una regla `fin_contador → siguiente`
    // (K4, D6). TODO(migración-etapa-K): retirar el camino directo cuando
    // presentación adopte el motor.
    if (emitir) return;
    // En clase en vivo `navigate` es null: el docente controla el avance.
    if (cfg.alTerminar === 'siguiente' && navigate) {
      navigate({ kind: 'siguiente' });
    }
  }, [ms, cfg.modo, cfg.alTerminar, cfg.hitosAlerta, navigate, isThumbnail, emitir]);

  const displaySeconds = ms / 1000;
  const ended = cfg.modo === 'temporizador' && ranRef.current && ms <= 0 && !isThumbnail;

  const handleReset = () => {
    endedRef.current = false;
    ranRef.current = false;
    hitosDisparados.current = new Set();
    setHitoActivo(null);
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
        hitoActivo={hitoActivo}
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
