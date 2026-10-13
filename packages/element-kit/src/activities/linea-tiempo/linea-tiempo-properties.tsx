'use client';

import { useMemo } from 'react';
import { ArrowDownUp, Plus, Trash2 } from 'lucide-react';
import type { LineaTiempoActivity, LineaTiempoEvento } from '@lumina/types/slide';
import { Button } from '@lumina/ui/button';
import { Label } from '@lumina/ui/label';
import { Textarea } from '@lumina/ui/textarea';

import {
  LINEA_MAX_EVENTOS,
  generarIdLinea,
  normalizarLineaTiempo,
  renumerarEventos,
} from './linea-tiempo-config.js';

interface LineaTiempoPropertiesProps {
  actividad: LineaTiempoActivity;
  onChange: (actividad: LineaTiempoActivity) => void;
}

const CAMPO = 'w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground';

export function LineaTiempoProperties({ actividad, onChange }: LineaTiempoPropertiesProps) {
  const act = useMemo(() => normalizarLineaTiempo(actividad), [actividad]);
  const emitir = (parche: Partial<LineaTiempoActivity>) => onChange({ ...act, ...parche });
  const cambiar = (id: string, parche: Partial<LineaTiempoEvento>) =>
    emitir({ eventos: act.eventos.map((e) => (e.id === id ? { ...e, ...parche } : e)) });

  const agregar = () => {
    if (act.eventos.length >= LINEA_MAX_EVENTOS) return;
    const siguiente = act.eventos.reduce((m, e) => Math.max(m, e.orden), 0) + 1;
    emitir({ eventos: [...act.eventos, { id: generarIdLinea(), texto: '', fechaTexto: '', orden: siguiente }] });
  };
  const quitar = (id: string) => emitir({ eventos: act.eventos.filter((e) => e.id !== id) });

  const ordenes = act.eventos.map((e) => e.orden);
  const desordenada = ordenes.some((o, i) => o !== i + 1);

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex flex-col gap-1">
        <Label htmlFor="lt-instruccion" className="text-[11px]">
          Instrucción
        </Label>
        <Textarea
          id="lt-instruccion"
          value={act.instruccion}
          onChange={(e) => emitir({ instruccion: e.target.value })}
          rows={2}
          className="text-xs"
        />
      </div>

      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          checked={act.mostrarFechasAlFinal}
          onChange={(e) => emitir({ mostrarFechasAlFinal: e.target.checked })}
        />
        Mostrar las fechas al comprobar
      </label>

      <section aria-label="Eventos" className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold text-muted-foreground">
            Eventos ({act.eventos.length}/{LINEA_MAX_EVENTOS})
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 gap-1 text-[10px]"
            disabled={!desordenada && act.eventos.length > 0}
            title="Ordena la lista por el número de orden y lo renumera de 1 a n"
            onClick={() => emitir({ eventos: renumerarEventos(act.eventos) })}
          >
            <ArrowDownUp className="size-3" /> Ordenar por orden
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          El número de orden es la posición cronológica correcta (1 = el más antiguo). El alumno los ve mezclados.
        </p>
        {act.eventos.map((e, n) => (
          <div key={e.id} className="flex flex-col gap-1 rounded border border-border bg-muted/40 p-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                aria-label={`Orden del evento ${n + 1}`}
                value={e.orden}
                onChange={(ev) => {
                  const v = Number(ev.target.value);
                  if (Number.isFinite(v)) cambiar(e.id, { orden: v });
                }}
                className={`${CAMPO} w-14 shrink-0`}
              />
              <input
                type="text"
                aria-label={`Fecha del evento ${n + 1}`}
                value={e.fechaTexto}
                onChange={(ev) => cambiar(e.id, { fechaTexto: ev.target.value })}
                placeholder="Fecha (1810, siglo XV…)"
                className={CAMPO}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-red-600"
                aria-label={`Quitar evento ${n + 1}`}
                onClick={() => quitar(e.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <input
              type="text"
              aria-label={`Texto del evento ${n + 1}`}
              value={e.texto}
              onChange={(ev) => cambiar(e.id, { texto: ev.target.value })}
              placeholder="Qué ocurrió"
              className={CAMPO}
            />
            <input
              type="text"
              aria-label={`Imagen del evento ${n + 1}`}
              value={e.imagen ?? ''}
              onChange={(ev) => cambiar(e.id, { imagen: ev.target.value || undefined })}
              placeholder="URL de imagen (opcional)"
              className={`${CAMPO} text-muted-foreground`}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          disabled={act.eventos.length >= LINEA_MAX_EVENTOS}
          onClick={agregar}
        >
          <Plus className="size-3" /> Agregar evento
        </Button>
      </section>
    </div>
  );
}
