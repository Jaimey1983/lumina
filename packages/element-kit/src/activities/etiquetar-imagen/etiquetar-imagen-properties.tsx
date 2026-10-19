'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { EtiquetarImagenActivity } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';

import {
  ETIQUETAR_MAX_ETIQUETAS,
  ETIQUETAR_MAX_ZONAS,
  generarIdEtiquetar,
  quitarMarcador,
  normalizarEtiquetarImagen,
} from './etiquetar-imagen-config.js';

interface EtiquetarImagenPropertiesProps {
  actividad: EtiquetarImagenActivity;
  onChange: (actividad: EtiquetarImagenActivity) => void;
}

const SIN_ETIQUETA = '';
const CAMPO = 'w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground';

export function EtiquetarImagenProperties({ actividad, onChange }: EtiquetarImagenPropertiesProps) {
  // El editor conserva los marcadores sin etiqueta para que el docente los reasigne.
  const act = useMemo(() => normalizarEtiquetarImagen(actividad, false), [actividad]);

  const emitir = (parche: Partial<EtiquetarImagenActivity>) => onChange({ ...act, ...parche });
  const usadas = new Set(act.zonas.map((z) => z.etiquetaId));

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
          Los marcadores se colocan sobre la imagen, en el lienzo: selecciona la actividad y haz clic donde va cada uno;
          arrástralo para moverlo. Aquí eliges qué etiqueta lleva cada marcador.
        </p>
        {act.zonas.map((z, i) => (
          <div key={z.id} className="flex items-center gap-2 rounded border border-border bg-muted/40 p-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-[11px] font-bold">
              {i + 1}
            </span>
            <select
              aria-label={`Etiqueta del marcador ${i + 1}`}
              value={z.etiquetaId}
              onChange={(e) => asignar(z.id, e.target.value)}
              className={`${CAMPO} flex-1`}
            >
              <option value={SIN_ETIQUETA}>— sin etiqueta —</option>
              {act.etiquetas.map((et, n) => (
                <option key={et.id} value={et.id}>
                  {et.texto || `Etiqueta ${n + 1}`}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
              aria-label={`Quitar el marcador ${i + 1}`}
              onClick={() => emitir(quitarMarcador(act, z.id))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
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
