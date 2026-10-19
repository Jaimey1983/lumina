'use client';

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { EtiquetarImagenActivity } from '@lumina/types/slide';

import {
  agregarMarcador,
  fraccion,
  moverMarcador,
  normalizarEtiquetarImagen,
  quitarMarcador,
} from './etiquetar-imagen-config.js';

interface EtiquetarImagenEditorProps {
  actividad: EtiquetarImagenActivity;
  isSelected?: boolean;
  /** Sin él, el lienzo es solo de lectura. */
  onChange?: (actividad: EtiquetarImagenActivity) => void;
}

/** Proporción de la imagen mientras no se conoce la real (la misma del viewer). */
const PROPORCION_INICIAL = 1.6;
/** Paso al mover un marcador con flechas (con Mayús, el quíntuple). */
const PASO_TECLADO = 0.01;
/** Pixeles que hay que mover el puntero antes de considerar que se arrastra (y no que se hace clic). */
const UMBRAL_ARRASTRE = 3;

/**
 * Lienzo del editor: la imagen con sus marcadores numerados, EDITABLE aquí mismo (no en el panel).
 * Con el bloque seleccionado: clic sobre la imagen pone un marcador, se arrastra para moverlo, las
 * flechas lo afinan y Supr lo quita. Qué etiqueta lleva cada uno se elige en el panel de propiedades.
 *
 * La caja de la imagen tiene SU proporción (no `object-contain` dentro de un rectángulo ajeno): así
 * las fracciones 0–1 de los marcadores caen exactamente donde el viewer los dibuja.
 */
export function EtiquetarImagenEditor({ actividad, isSelected = false, onChange }: EtiquetarImagenEditorProps) {
  const act = useMemo(() => normalizarEtiquetarImagen(actividad, false), [actividad]);
  const editable = isSelected && !!onChange;
  const cajaRef = useRef<HTMLDivElement>(null);
  const [proporcion, setProporcion] = useState(PROPORCION_INICIAL);
  const [elegida, setElegida] = useState<string | null>(null);
  /** Posición provisional mientras se arrastra: se confirma (un solo `onChange`) al soltar. */
  const [arrastre, setArrastre] = useState<{ id: string; x: number; y: number } | null>(null);
  const gesto = useRef<{ id: string; inicioX: number; inicioY: number; movido: boolean } | null>(null);

  const etiquetaDe = (id: string) => act.etiquetas.find((e) => e.id === id)?.texto ?? '';
  const posicion = (id: string, x: number, y: number) => (arrastre?.id === id ? { x: arrastre.x, y: arrastre.y } : { x, y });

  const fraccionesDe = (clientX: number, clientY: number) => {
    const r = cajaRef.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return null;
    return { x: fraccion((clientX - r.left) / r.width), y: fraccion((clientY - r.top) / r.height) };
  };

  /** Clic sobre la imagen (no sobre un marcador): pone un marcador nuevo. */
  const alBajarFondo = (e: PointerEvent<HTMLDivElement>) => {
    if (!editable || e.target !== e.currentTarget) return;
    const f = fraccionesDe(e.clientX, e.clientY);
    if (!f) return;
    const nuevo = agregarMarcador(act, f.x, f.y);
    if (!nuevo) return;
    onChange?.(nuevo.actividad);
    setElegida(nuevo.zonaId);
  };

  const alBajarMarcador = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!editable) return;
    e.stopPropagation();
    gesto.current = { id, inicioX: e.clientX, inicioY: e.clientY, movido: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setElegida(id);
  };
  const alMoverMarcador = (e: PointerEvent<HTMLButtonElement>) => {
    const g = gesto.current;
    if (!g) return;
    if (!g.movido && Math.hypot(e.clientX - g.inicioX, e.clientY - g.inicioY) < UMBRAL_ARRASTRE) return;
    const f = fraccionesDe(e.clientX, e.clientY);
    if (!f) return;
    g.movido = true;
    setArrastre({ id: g.id, ...f });
  };
  const alSoltarMarcador = (e: PointerEvent<HTMLButtonElement>) => {
    const g = gesto.current;
    gesto.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (g?.movido) {
      const f = fraccionesDe(e.clientX, e.clientY) ?? arrastre;
      if (f) onChange?.(moverMarcador(act, g.id, f.x, f.y));
    }
    setArrastre(null);
  };

  const alTeclearMarcador = (e: KeyboardEvent<HTMLButtonElement>, id: string, x: number, y: number) => {
    if (!editable) return;
    const paso = PASO_TECLADO * (e.shiftKey ? 5 : 1);
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0],
      ArrowRight: [paso, 0],
      ArrowUp: [0, -paso],
      ArrowDown: [0, paso],
    };
    const d = delta[e.key];
    if (d) {
      e.preventDefault();
      onChange?.(moverMarcador(act, id, x + d[0], y + d[1]));
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onChange?.(quitarMarcador(act, id));
      setElegida(null);
    }
  };

  return (
    <div className="flex h-full w-full select-none flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etiquetar imagen</span>
        <span className="text-xs text-muted-foreground">
          {act.zonas.length} {act.zonas.length === 1 ? 'marcador' : 'marcadores'} · {act.etiquetas.length}{' '}
          {act.etiquetas.length === 1 ? 'etiqueta' : 'etiquetas'}
        </span>
      </div>
      {act.instruccion && <p className="truncate px-1 text-xs text-muted-foreground">{act.instruccion}</p>}
      {/* `container-type: size` deja ajustar la caja a su proporción dentro del hueco disponible (cqw/cqh). */}
      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40"
        style={{ containerType: 'size' }}
      >
        {act.imagen ? (
          <div
            ref={cajaRef}
            data-testid="ei-lienzo"
            // El bloque seleccionado cede el gesto al lienzo: sin esto, arrastrar un marcador movería todo el bloque.
            data-moveable-ignore={editable ? '' : undefined}
            onPointerDown={alBajarFondo}
            className={`relative ${editable ? 'cursor-crosshair' : ''}`}
            style={
              {
                aspectRatio: String(proporcion),
                width: `min(100cqw, calc(100cqh * ${proporcion}))`,
              } as CSSProperties
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- la URL la pone el docente; no pasa por el optimizador. */}
            <img
              src={act.imagen}
              alt={act.textoAlternativo}
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full"
              onLoad={(e) => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                if (w > 0 && h > 0) setProporcion(w / h);
              }}
            />
            {act.zonas.map((z, i) => {
              const { x, y } = posicion(z.id, z.x, z.y);
              const texto = etiquetaDe(z.etiquetaId);
              const activa = editable && elegida === z.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  data-zona-id={z.id}
                  aria-label={`Marcador ${i + 1}${texto ? `: ${texto}` : ''}`}
                  aria-pressed={activa}
                  aria-disabled={!editable || undefined}
                  tabIndex={editable ? 0 : -1}
                  onPointerDown={(e) => alBajarMarcador(e, z.id)}
                  onPointerMove={alMoverMarcador}
                  onPointerUp={alSoltarMarcador}
                  onPointerCancel={alSoltarMarcador}
                  onKeyDown={(e) => alTeclearMarcador(e, z.id, z.x, z.y)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setElegida(z.id);
                  }}
                  style={{ left: `${x * 100}%`, top: `${y * 100}%`, touchAction: 'none' }}
                  className={`absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[11px] font-bold shadow ${
                    activa
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-primary bg-background text-foreground'
                  } ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  {i + 1}
                  {texto && (
                    // El punto exacto es el centro de la insignia: el texto cuelga a un lado.
                    <span className="pointer-events-none absolute left-full top-1/2 ml-1 max-w-32 -translate-y-1/2 truncate rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow">
                      {texto}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sin imagen: pega una URL en el panel de propiedades.
          </p>
        )}
      </div>
      {editable && act.imagen && (
        <p className="px-1 text-[10px] text-muted-foreground">
          Clic en la imagen: nuevo marcador · arrastra para moverlo · flechas para afinar · Supr para quitarlo.
        </p>
      )}
    </div>
  );
}
