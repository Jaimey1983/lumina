'use client';

import { useCallback } from 'react';

import type { Block } from '@/types/slide.types';
import type { RuletaWidget } from '@/types/widget.types';

import { generarIdRuleta, RULETA_MAX_ITEMS, RULETA_MIN_ITEMS } from './ruleta-config';
import { normalizeRuletaBlock } from './ruleta-defaults';

export interface RuletaPropertiesProps {
  block: RuletaWidget;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function RuletaProperties({ block: rawBlock, applyNow }: RuletaPropertiesProps) {
  const widget = normalizeRuletaBlock(rawBlock);
  const { configuracion, items } = widget;

  const update = useCallback(
    (fn: (w: RuletaWidget) => RuletaWidget) => {
      void applyNow((b) => {
        if (b.tipo === 'ruleta') return fn(normalizeRuletaBlock(b));
        if (b.tipo === 'actividad' && b.actividad?.tipo === 'ruleta') {
          return fn(normalizeRuletaBlock(b));
        }
        return b;
      });
    },
    [applyNow],
  );

  const updateConfig = (partial: Partial<RuletaWidget['configuracion']>) => {
    update((w) => ({ ...w, configuracion: { ...w.configuracion, ...partial } }));
  };

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <section>
        <h4 className="mb-2 font-semibold text-gray-700">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Duración del giro</span>
            <select
              value={configuracion.duracionGiro}
              onChange={(e) => updateConfig({ duracionGiro: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={2000}>Rápido (2s)</option>
              <option value={3000}>Normal (3s)</option>
              <option value={4500}>Lento (4.5s)</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Mostrar ganador</span>
            <input
              type="checkbox"
              checked={configuracion.mostrarGanador}
              onChange={(e) => updateConfig({ mostrarGanador: e.target.checked })}
            />
          </label>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">Elementos ({items.length})</h4>
          <button
            type="button"
            onClick={() => {
              if (items.length >= RULETA_MAX_ITEMS) return;
              const id = generarIdRuleta('i');
              update((w) => ({
                ...w,
                items: [...w.items, { id, texto: `Elemento ${w.items.length + 1}` }],
              }));
            }}
            disabled={items.length >= RULETA_MAX_ITEMS}
            className="rounded bg-[#2563EB] px-2 py-1 text-xs text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: configuracion.colores[idx % configuracion.colores.length],
                }}
              />
              <input
                type="text"
                value={item.texto}
                onChange={(e) => {
                  const texto = e.target.value;
                  update((w) => ({
                    ...w,
                    items: w.items.map((i) => (i.id === item.id ? { ...i, texto } : i)),
                  }));
                }}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (items.length <= RULETA_MIN_ITEMS) return;
                  update((w) => ({
                    ...w,
                    items: w.items.filter((i) => i.id !== item.id),
                  }));
                }}
                disabled={items.length <= RULETA_MIN_ITEMS}
                className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
