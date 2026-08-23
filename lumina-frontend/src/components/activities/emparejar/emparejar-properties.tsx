'use client';

import React, { useCallback } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { EmparejaLado, MatchPair, MatchPairs } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  EMPAREJAR_MAX_PARES,
  EMPAREJAR_MIN_PARES,
  generarIdEmparejar,
} from './emparejar-config';

interface EmparejarPropertiesProps {
  actividad: MatchPairs;
  onChange: (actividad: MatchPairs) => void;
}

function CampoLado({
  label,
  lado,
  onChange,
}: {
  label: string;
  lado: EmparejaLado;
  onChange: (lado: EmparejaLado) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
      <input
        type="text"
        value={lado.texto ?? ''}
        onChange={(e) =>
          onChange({ ...lado, texto: e.target.value || undefined })
        }
        placeholder="Texto"
        className="rounded border border-gray-300 px-2 py-1 text-xs w-full"
      />
      <input
        type="text"
        value={lado.imagen ?? ''}
        onChange={(e) =>
          onChange({ ...lado, imagen: e.target.value || undefined })
        }
        placeholder="URL imagen (opcional)"
        className="rounded border border-gray-300 px-2 py-1 text-xs w-full text-gray-400"
      />
      {lado.imagen && (
        <img
          src={lado.imagen}
          alt=""
          className="h-10 w-auto rounded border border-gray-200 object-cover"
        />
      )}
    </div>
  );
}

export function EmparejarProperties({ actividad, onChange }: EmparejarPropertiesProps) {
  const { instruccion, pares } = actividad;

  const update = useCallback(
    (partial: Partial<MatchPairs>) => {
      onChange({ ...actividad, ...partial, tipo: 'emparejar' });
    },
    [actividad, onChange],
  );

  const addPar = useCallback(() => {
    if (pares.length >= EMPAREJAR_MAX_PARES) return;
    const id = generarIdEmparejar('par');
    update({
      pares: [...pares, { id, izquierda: { texto: '' }, derecha: { texto: '' } }],
    });
  }, [pares, update]);

  const removePar = useCallback(
    (id: string) => {
      if (pares.length <= EMPAREJAR_MIN_PARES) return;
      update({ pares: pares.filter((p) => p.id !== id) });
    },
    [pares, update],
  );

  const updatePar = useCallback(
    (id: string, partial: Partial<MatchPair>) => {
      update({
        pares: pares.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      });
    },
    [pares, update],
  );

  const updateLado = useCallback(
    (id: string, campo: 'izquierda' | 'derecha', lado: EmparejaLado) => {
      updatePar(id, { [campo]: lado });
    },
    [updatePar],
  );

  const movePar = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === pares.length - 1) return;
      const newPares = [...pares];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newPares[index], newPares[swapIndex]] = [newPares[swapIndex], newPares[index]];
      update({ pares: newPares });
    },
    [pares, update],
  );

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <section>
        <Label htmlFor="emp-instruccion" className="text-[11px] font-medium">
          Instrucciones
        </Label>
        <Textarea
          id="emp-instruccion"
          value={instruccion}
          onChange={(e) => update({ instruccion: e.target.value })}
          rows={2}
          className="mt-1 min-h-[2.75rem] resize-none text-xs"
          placeholder="Ej: Empareja cada concepto con su definición…"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">
            Pares ({pares.length})
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPar}
            disabled={pares.length >= EMPAREJAR_MAX_PARES}
            className="h-6 px-2 text-[10px]"
          >
            <Plus className="mr-1 size-3" />
            Añadir
          </Button>
        </div>
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {pares.map((par, idx) => (
            <div
              key={par.id}
              className="flex items-start gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2"
            >
              <div className="flex flex-col items-center gap-0.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  disabled={idx === 0}
                  onClick={() => movePar(idx, 'up')}
                >
                  <ArrowUp className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5"
                  disabled={idx === pares.length - 1}
                  onClick={() => movePar(idx, 'down')}
                >
                  <ArrowDown className="size-3" />
                </Button>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-2 min-w-0">
                <CampoLado
                  label="Izquierda"
                  lado={par.izquierda}
                  onChange={(lado) => updateLado(par.id, 'izquierda', lado)}
                />
                <CampoLado
                  label="Derecha"
                  lado={par.derecha}
                  onChange={(lado) => updateLado(par.id, 'derecha', lado)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-gray-400 hover:text-red-500"
                disabled={pares.length <= EMPAREJAR_MIN_PARES}
                onClick={() => removePar(par.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
