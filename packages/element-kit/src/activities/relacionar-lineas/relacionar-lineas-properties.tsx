'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { RelacionarLineasActivity, RelacionarLineasItem } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';

import {
  RELACIONAR_MAX_DERECHA,
  RELACIONAR_MAX_IZQUIERDA,
  etiquetaItem,
  generarIdRelacionar,
  normalizarRelacionarLineas,
} from './relacionar-lineas-config.js';

interface RelacionarLineasPropertiesProps {
  actividad: RelacionarLineasActivity;
  onChange: (actividad: RelacionarLineasActivity) => void;
}

const SIN_RELACION = '';
const CAMPO = 'w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground';

function CamposItem({
  item,
  etiqueta,
  onChange,
}: {
  item: RelacionarLineasItem;
  etiqueta: string;
  onChange: (item: RelacionarLineasItem) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        aria-label={`${etiqueta}: texto`}
        value={item.texto ?? ''}
        onChange={(e) => onChange({ ...item, texto: e.target.value || undefined })}
        placeholder="Texto"
        className={CAMPO}
      />
      <input
        type="text"
        aria-label={`${etiqueta}: imagen`}
        value={item.imagen ?? ''}
        onChange={(e) => onChange({ ...item, imagen: e.target.value || undefined })}
        placeholder="URL de imagen (opcional)"
        className={`${CAMPO} text-muted-foreground`}
      />
    </div>
  );
}

export function RelacionarLineasProperties({ actividad, onChange }: RelacionarLineasPropertiesProps) {
  const act = useMemo(() => normalizarRelacionarLineas(actividad), [actividad]);
  const derechaDe = (izquierdaId: string) => act.relaciones.find((r) => r.izquierdaId === izquierdaId)?.derechaId ?? SIN_RELACION;
  const emitir = (parche: Partial<RelacionarLineasActivity>) => onChange({ ...act, ...parche });

  const cambiarIzquierda = (item: RelacionarLineasItem) =>
    emitir({ izquierda: act.izquierda.map((i) => (i.id === item.id ? item : i)) });
  const cambiarDerecha = (item: RelacionarLineasItem) =>
    emitir({ derecha: act.derecha.map((d) => (d.id === item.id ? item : d)) });

  const fijarRelacion = (izquierdaId: string, derechaId: string) => {
    const resto = act.relaciones.filter((r) => r.izquierdaId !== izquierdaId);
    emitir({ relaciones: derechaId === SIN_RELACION ? resto : [...resto, { izquierdaId, derechaId }] });
  };

  const agregarIzquierda = () => {
    if (act.izquierda.length >= RELACIONAR_MAX_IZQUIERDA) return;
    emitir({ izquierda: [...act.izquierda, { id: generarIdRelacionar('izq'), texto: '' }] });
  };
  const agregarDerecha = () => {
    if (act.derecha.length >= RELACIONAR_MAX_DERECHA) return;
    emitir({ derecha: [...act.derecha, { id: generarIdRelacionar('der'), texto: '' }] });
  };
  const quitarIzquierda = (id: string) =>
    emitir({
      izquierda: act.izquierda.filter((i) => i.id !== id),
      relaciones: act.relaciones.filter((r) => r.izquierdaId !== id),
    });
  const quitarDerecha = (id: string) =>
    emitir({
      derecha: act.derecha.filter((d) => d.id !== id),
      relaciones: act.relaciones.filter((r) => r.derechaId !== id),
    });

  const usadas = new Set(act.relaciones.map((r) => r.derechaId));

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-col gap-1">
        <Label htmlFor="rl-instruccion" className="text-[11px]">
          Instrucción
        </Label>
        <Textarea
          id="rl-instruccion"
          value={act.instruccion}
          onChange={(e) => emitir({ instruccion: e.target.value })}
          rows={2}
          className="text-xs"
        />
      </div>

      <section aria-label="Columna izquierda" className="flex flex-col gap-2">
        <h4 className="text-[11px] font-semibold text-muted-foreground">
          Columna izquierda ({act.izquierda.length}/{RELACIONAR_MAX_IZQUIERDA})
        </h4>
        {act.izquierda.map((it, n) => (
          <div key={it.id} className="flex flex-col gap-1.5 rounded border border-border bg-muted/40 p-2">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <CamposItem item={it} etiqueta={`Izquierda ${n + 1}`} onChange={cambiarIzquierda} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
                aria-label={`Quitar izquierda ${n + 1}`}
                onClick={() => quitarIzquierda(it.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              Se une con
              <select
                aria-label={`Pareja de izquierda ${n + 1}`}
                value={derechaDe(it.id)}
                onChange={(e) => fijarRelacion(it.id, e.target.value)}
                className={`${CAMPO} flex-1`}
              >
                <option value={SIN_RELACION}>— sin relación —</option>
                {act.derecha.map((d, m) => (
                  <option key={d.id} value={d.id}>
                    {etiquetaItem(d) || `Derecha ${m + 1}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          disabled={act.izquierda.length >= RELACIONAR_MAX_IZQUIERDA}
          onClick={agregarIzquierda}
        >
          <Plus className="size-3" /> Agregar a la izquierda
        </Button>
      </section>

      <section aria-label="Columna derecha" className="flex flex-col gap-2">
        <h4 className="text-[11px] font-semibold text-muted-foreground">
          Columna derecha ({act.derecha.length}/{RELACIONAR_MAX_DERECHA})
        </h4>
        {act.derecha.map((it, n) => (
          <div key={it.id} className="flex items-start gap-2 rounded border border-border bg-muted/40 p-2">
            <div className="min-w-0 flex-1">
              <CamposItem item={it} etiqueta={`Derecha ${n + 1}`} onChange={cambiarDerecha} />
              {!usadas.has(it.id) && <p className="mt-1 text-[10px] text-muted-foreground">Distractor: ninguna izquierda se une con este.</p>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
              aria-label={`Quitar derecha ${n + 1}`}
              onClick={() => quitarDerecha(it.id)}
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
          disabled={act.derecha.length >= RELACIONAR_MAX_DERECHA}
          onClick={agregarDerecha}
        >
          <Plus className="size-3" /> Agregar a la derecha (o distractor)
        </Button>
      </section>
    </div>
  );
}
