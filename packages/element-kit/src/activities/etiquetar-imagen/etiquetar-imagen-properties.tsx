'use client';

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EtiquetarImagenActivity, EtiquetarImagenZona } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';

import {
  ETIQUETAR_MAX_ETIQUETAS,
  ETIQUETAR_MAX_ZONAS,
  fraccion,
  generarIdEtiquetar,
  normalizarEtiquetarImagen,
} from './etiquetar-imagen-config.js';

interface EtiquetarImagenPropertiesProps {
  actividad: EtiquetarImagenActivity;
  onChange: (actividad: EtiquetarImagenActivity) => void;
}

const SIN_ETIQUETA = '';
const CAMPO = 'w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground';
/** Paso al mover un marcador con flechas (con Mayús, el quíntuple). */
const PASO_TECLADO = 0.01;

export function EtiquetarImagenProperties({ actividad, onChange }: EtiquetarImagenPropertiesProps) {
  // El editor conserva los marcadores sin etiqueta para que el docente los reasigne.
  const act = useMemo(() => normalizarEtiquetarImagen(actividad, false), [actividad]);
  const [elegida, setElegida] = useState<string | null>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const arrastrando = useRef<string | null>(null);
  const movido = useRef(false);

  const emitir = (parche: Partial<EtiquetarImagenActivity>) => onChange({ ...act, ...parche });
  const zonaElegida = act.zonas.find((z) => z.id === elegida);
  const usadas = new Set(act.zonas.map((z) => z.etiquetaId));

  const mover = (id: string, x: number, y: number) =>
    emitir({ zonas: act.zonas.map((z) => (z.id === id ? { ...z, x: fraccion(x), y: fraccion(y) } : z)) });

  const fraccionesDe = (clientX: number, clientY: number) => {
    const r = cajaRef.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return null;
    return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
  };

  /** Clic sobre la imagen: pone un marcador nuevo y le asigna la primera etiqueta libre. */
  const colocarMarcador = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.fondo) return;
    if (act.zonas.length >= ETIQUETAR_MAX_ZONAS) return;
    const f = fraccionesDe(e.clientX, e.clientY);
    if (!f) return;
    let etiquetas = act.etiquetas;
    let etiquetaId = etiquetas.find((et) => !usadas.has(et.id))?.id;
    if (!etiquetaId) {
      if (etiquetas.length >= ETIQUETAR_MAX_ETIQUETAS) return;
      etiquetaId = generarIdEtiquetar('etq');
      etiquetas = [...etiquetas, { id: etiquetaId, texto: '' }];
    }
    const zona: EtiquetarImagenZona = { id: generarIdEtiquetar('zona'), x: fraccion(f.x), y: fraccion(f.y), etiquetaId };
    emitir({ zonas: [...act.zonas, zona], etiquetas });
    setElegida(zona.id);
  };

  const alBajarMarcador = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    arrastrando.current = id;
    movido.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setElegida(id);
  };
  const alMoverMarcador = (e: PointerEvent<HTMLButtonElement>) => {
    const id = arrastrando.current;
    if (!id) return;
    const f = fraccionesDe(e.clientX, e.clientY);
    if (!f) return;
    movido.current = true;
    mover(id, f.x, f.y);
  };
  const alSoltarMarcador = (e: PointerEvent<HTMLButtonElement>) => {
    arrastrando.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const alTeclearMarcador = (e: KeyboardEvent<HTMLButtonElement>, z: EtiquetarImagenZona) => {
    const paso = PASO_TECLADO * (e.shiftKey ? 5 : 1);
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0],
      ArrowRight: [paso, 0],
      ArrowUp: [0, -paso],
      ArrowDown: [0, paso],
    };
    if (delta[e.key]) {
      e.preventDefault();
      mover(z.id, z.x + delta[e.key]![0], z.y + delta[e.key]![1]);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      quitarZona(z.id);
    }
  };

  const quitarZona = (id: string) => {
    emitir({ zonas: act.zonas.filter((z) => z.id !== id) });
    if (elegida === id) setElegida(null);
  };

  const asignar = (zonaId: string, etiquetaId: string) =>
    emitir({ zonas: act.zonas.map((z) => (z.id === zonaId ? { ...z, etiquetaId } : z)) });

  const agregarEtiqueta = () => {
    if (act.etiquetas.length >= ETIQUETAR_MAX_ETIQUETAS) return;
    emitir({ etiquetas: [...act.etiquetas, { id: generarIdEtiquetar('etq'), texto: '' }] });
  };
  const cambiarEtiqueta = (id: string, texto: string) =>
    emitir({ etiquetas: act.etiquetas.map((e) => (e.id === id ? { ...e, texto } : e)) });
  const quitarEtiqueta = (id: string) =>
    emitir({
      etiquetas: act.etiquetas.filter((e) => e.id !== id),
      // Un marcador cuya etiqueta se borra queda sin asignar (el validador lo avisa).
      zonas: act.zonas.map((z) => (z.etiquetaId === id ? { ...z, etiquetaId: SIN_ETIQUETA } : z)),
    });

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-col gap-1">
        <Label htmlFor="ei-instruccion" className="text-[11px]">
          Instrucción
        </Label>
        <Textarea
          id="ei-instruccion"
          value={act.instruccion}
          onChange={(e) => emitir({ instruccion: e.target.value })}
          rows={2}
          className="text-xs"
        />
      </div>

      <section aria-label="Imagen" className="flex flex-col gap-1.5">
        <h4 className="text-[11px] font-semibold text-muted-foreground">Imagen</h4>
        <input
          type="text"
          aria-label="URL de la imagen"
          value={act.imagen.startsWith('data:') ? '' : act.imagen}
          onChange={(e) => emitir({ imagen: e.target.value })}
          placeholder={act.imagen.startsWith('data:') ? 'Imagen de ejemplo (pega una URL para cambiarla)' : 'https://…'}
          className={CAMPO}
        />
        <textarea
          aria-label="Texto alternativo"
          value={act.textoAlternativo}
          onChange={(e) => emitir({ textoAlternativo: e.target.value })}
          rows={2}
          placeholder="Describe la imagen para quien no la ve"
          className={CAMPO}
        />
      </section>

      <section aria-label="Marcadores" className="flex flex-col gap-1.5">
        <h4 className="text-[11px] font-semibold text-muted-foreground">
          Marcadores ({act.zonas.length}/{ETIQUETAR_MAX_ZONAS})
        </h4>
        <p className="text-[10px] text-muted-foreground">
          Haz clic en la imagen para poner un marcador; arrástralo (o usa las flechas) para moverlo y Supr para quitarlo.
        </p>
        <div
          ref={cajaRef}
          data-testid="ei-lienzo"
          onPointerDown={colocarMarcador}
          className="relative w-full cursor-crosshair overflow-hidden rounded border border-border bg-muted/40"
          style={{ aspectRatio: '1.6' }}
        >
          {act.imagen && (
            <img
              src={act.imagen}
              alt=""
              data-fondo="1"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            />
          )}
          {act.zonas.map((z, i) => (
            <button
              key={z.id}
              type="button"
              data-zona-id={z.id}
              aria-label={`Marcador ${i + 1}`}
              aria-pressed={elegida === z.id}
              onPointerDown={(e) => alBajarMarcador(e, z.id)}
              onPointerMove={alMoverMarcador}
              onPointerUp={alSoltarMarcador}
              onKeyDown={(e) => alTeclearMarcador(e, z)}
              onClick={(e) => {
                e.stopPropagation();
                setElegida(z.id);
              }}
              style={{ left: `${z.x * 100}%`, top: `${z.y * 100}%`, touchAction: 'none' }}
              className={`absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                elegida === z.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-primary bg-background text-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {zonaElegida && (
          <div className="flex items-center gap-2 rounded border border-border bg-muted/40 p-2">
            <label className="flex flex-1 items-center gap-2 text-[11px] text-muted-foreground">
              Marcador {act.zonas.indexOf(zonaElegida) + 1}
              <select
                aria-label="Etiqueta del marcador elegido"
                value={zonaElegida.etiquetaId}
                onChange={(e) => asignar(zonaElegida.id, e.target.value)}
                className={`${CAMPO} flex-1`}
              >
                <option value={SIN_ETIQUETA}>— sin etiqueta —</option>
                {act.etiquetas.map((et, n) => (
                  <option key={et.id} value={et.id}>
                    {et.texto || `Etiqueta ${n + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
              aria-label="Quitar el marcador elegido"
              onClick={() => quitarZona(zonaElegida.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </section>

      <section aria-label="Etiquetas" className="flex flex-col gap-2">
        <h4 className="text-[11px] font-semibold text-muted-foreground">
          Etiquetas ({act.etiquetas.length}/{ETIQUETAR_MAX_ETIQUETAS})
        </h4>
        {act.etiquetas.map((et, n) => (
          <div key={et.id} className="flex items-start gap-2 rounded border border-border bg-muted/40 p-2">
            <div className="min-w-0 flex-1">
              <input
                type="text"
                aria-label={`Etiqueta ${n + 1}`}
                value={et.texto}
                onChange={(e) => cambiarEtiqueta(et.id, e.target.value)}
                placeholder="Texto de la etiqueta"
                className={CAMPO}
              />
              {!usadas.has(et.id) && (
                <p className="mt-1 text-[10px] text-muted-foreground">Distractor: ningún marcador usa esta etiqueta.</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
              aria-label={`Quitar etiqueta ${n + 1}`}
              onClick={() => quitarEtiqueta(et.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          disabled={act.etiquetas.length >= ETIQUETAR_MAX_ETIQUETAS}
          onClick={agregarEtiqueta}
        >
          <Plus className="size-3" /> Agregar etiqueta (o distractor)
        </Button>
      </section>
    </div>
  );
}
