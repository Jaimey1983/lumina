'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RuletaWidget } from '@lumina/types/widget';

import { prefiereMovimientoReducido } from '../_motion/reduced-motion.js';
import { VISUALLY_HIDDEN } from '../visually-hidden.js';
import {
  RULETA_EASING,
  anguloDeMatriz,
  calcularIndiceBajoIndicador,
  calcularRotacionHastaGanador,
  elegirGanadorPonderado,
  pesoDe,
  type RuletaConfiguracion,
} from './ruleta-config.js';
import { RuletaConfeti } from './ruleta-confeti.js';
import { normalizeRuletaBlock } from './ruleta-defaults.js';
import { crearTicker, type TickerRuleta } from './ruleta-sound.js';
import { RuletaWheel } from './ruleta-wheel.js';

interface RuletaViewerProps {
  block: RuletaWidget;
}

const HISTORIAL_VISIBLE = 5;

export function RuletaViewer({ block }: RuletaViewerProps) {
  const widget = normalizeRuletaBlock(block);
  const configuracion = widget.configuracion as RuletaConfiguracion;
  const modoEliminar = configuracion.modoEliminar === true;
  const mostrarHistorial = configuracion.mostrarHistorial === true || modoEliminar;

  const [girando, setGirando] = useState(false);
  const [ganador, setGanador] = useState<string | null>(null);
  /** «Eliminar ganador»: ids ya fuera de la rueda y el ganador de la última tirada, por salir. */
  const [eliminados, setEliminados] = useState<string[]>([]);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [historial, setHistorial] = useState<string[]>([]);
  const [disparoConfeti, setDisparoConfeti] = useState(0);

  const wheelRef = useRef<HTMLDivElement>(null);
  const rotacionRef = useRef(0);
  const animRef = useRef<Animation | null>(null);
  const girandoRef = useRef(false);
  const rafRef = useRef(0);
  const tickerRef = useRef<TickerRuleta | null>(null);

  const activos = useMemo(
    () => widget.items.map((item, indice) => ({ item, indice })).filter(({ item }) => !eliminados.includes(item.id)),
    [widget.items, eliminados],
  );
  const items = activos.map((a) => a.item);
  const restantes = activos.length - (pendiente && activos.some((a) => a.item.id === pendiente) ? 1 : 0);
  const sinJugadas = modoEliminar && restantes < 2;

  useEffect(() => {
    return () => {
      animRef.current?.cancel();
      cancelAnimationFrame(rafRef.current);
      tickerRef.current?.cerrar();
    };
  }, []);

  const pararTicks = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    tickerRef.current?.cerrar();
    tickerRef.current = null;
  }, []);

  const handleGirar = useCallback(() => {
    if (girandoRef.current) return;

    // «Eliminar ganador»: el de la tirada anterior sale ahora y la rueda se rearma desde 0.
    let ids = eliminados;
    let desde = rotacionRef.current;
    if (modoEliminar && pendiente) {
      ids = [...eliminados, pendiente];
      setEliminados(ids);
      setPendiente(null);
      desde = 0;
      rotacionRef.current = 0;
    }
    const vigentes = widget.items.filter((item) => !ids.includes(item.id));
    if (vigentes.length === 0 || (modoEliminar && vigentes.length < 2)) return;

    const wheel = wheelRef.current;
    if (!wheel) return;
    animRef.current?.cancel();

    const pesosVigentes = vigentes.map((item) => pesoDe(item));
    const idxGanador = elegirGanadorPonderado(pesosVigentes);
    const destino = calcularRotacionHastaGanador(
      idxGanador,
      vigentes.length,
      desde,
      undefined,
      undefined,
      pesosVigentes,
    );

    girandoRef.current = true;
    setGirando(true);
    setGanador(null);

    wheel.style.transform = `rotate(${desde}deg)`;

    const reducido = prefiereMovimientoReducido();
    const anim = wheel.animate(
      [{ transform: `rotate(${desde}deg)` }, { transform: `rotate(${destino}deg)` }],
      {
        // Con «reducir movimiento» el giro salta directo al resultado.
        duration: reducido ? 1 : configuracion.duracionGiro,
        easing: RULETA_EASING,
        fill: 'forwards',
      },
    );
    animRef.current = anim;

    // Tick de sonido: uno por cada sector que pasa bajo el indicador (solo con `sonido`).
    if (configuracion.sonido && !reducido) {
      tickerRef.current?.cerrar();
      tickerRef.current = crearTicker();
      let ultimo = -1;
      const medir = () => {
        const angulo = anguloDeMatriz(getComputedStyle(wheel).transform);
        const indice = calcularIndiceBajoIndicador(angulo, vigentes.length, pesosVigentes);
        if (ultimo !== -1 && indice !== ultimo) tickerRef.current?.tick();
        ultimo = indice;
        rafRef.current = requestAnimationFrame(medir);
      };
      rafRef.current = requestAnimationFrame(medir);
    }

    void anim.finished
      .then(() => {
        rotacionRef.current = destino;
        wheel.style.transform = `rotate(${destino}deg)`;
        anim.cancel();

        const elegido = vigentes[idxGanador];
        if (configuracion.mostrarGanador) {
          setGanador(elegido?.texto ?? null);
        }
        if (elegido) {
          setHistorial((h) => [...h, elegido.texto]);
          if (modoEliminar) setPendiente(elegido.id);
          if (configuracion.confeti === true && !reducido) setDisparoConfeti((n) => n + 1);
        }
      })
      .catch(() => {
        // Animación cancelada (p. ej. desmontaje)
      })
      .finally(() => {
        pararTicks();
        girandoRef.current = false;
        setGirando(false);
        animRef.current = null;
      });
  }, [
    widget.items,
    eliminados,
    pendiente,
    modoEliminar,
    configuracion.duracionGiro,
    configuracion.mostrarGanador,
    configuracion.sonido,
    configuracion.confeti,
    pararTicks,
  ]);

  const handleReiniciar = () => {
    setEliminados([]);
    setPendiente(null);
    setHistorial([]);
    setGanador(null);
    rotacionRef.current = 0;
    if (wheelRef.current) wheelRef.current.style.transform = 'rotate(0deg)';
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-between gap-3 p-2">
      <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
        <RuletaWheel
          ref={wheelRef}
          items={items}
          colores={configuracion.colores}
          indicesColor={modoEliminar ? activos.map((a) => a.indice) : undefined}
        />
        <RuletaConfeti disparo={disparoConfeti} activo={configuracion.confeti === true} />

        <div role="status" aria-live="polite" style={VISUALLY_HIDDEN}>
          {ganador ? `Ganador: ${ganador}` : ''}
        </div>

        {ganador && (
          <div
            aria-hidden="true"
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
        disabled={girando || sinJugadas}
        className="relative z-20 mx-auto shrink-0 px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:brightness-105 active:scale-[0.97] disabled:opacity-50 cursor-pointer"
        style={{
          backgroundColor: 'var(--lw-color-primary, #2563EB)',
          borderRadius: 'var(--lw-radius-lg, 0.75rem)',
        }}
      >
        {girando ? 'Girando...' : 'Girar'}
      </button>

      {modoEliminar && (eliminados.length > 0 || pendiente) ? (
        <p className="m-0 shrink-0 text-center text-[11px] text-gray-500">
          {sinJugadas ? 'Ya no quedan más para sortear. ' : `Quedan ${restantes}. `}
          <button
            type="button"
            onClick={handleReiniciar}
            disabled={girando}
            className="underline underline-offset-2 hover:text-gray-700 disabled:opacity-50"
          >
            Reiniciar
          </button>
        </p>
      ) : null}

      {mostrarHistorial && historial.length > 0 ? (
        <ol
          aria-label="Historial de tiradas"
          className="m-0 flex max-w-full shrink-0 list-none flex-wrap justify-center gap-x-2 gap-y-0.5 p-0 text-[11px] text-gray-600"
        >
          {historial
            .map((texto, i) => ({ texto, numero: i + 1 }))
            .slice(-HISTORIAL_VISIBLE)
            .map(({ texto, numero }) => (
              <li key={numero} className="truncate">
                <span className="font-semibold">{numero}.</span> {texto}
              </li>
            ))}
        </ol>
      ) : null}
    </div>
  );
}
