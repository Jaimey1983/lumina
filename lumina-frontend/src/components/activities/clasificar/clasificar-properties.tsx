'use client';

import React, { useCallback } from 'react';
import { ClasificarActivity, ClasificarCategoria, ClasificarItem } from '@/types/slide.types';
import {
  generarIdClasificar,
  CLASIFICAR_MAX_CATEGORIAS,
  CLASIFICAR_MIN_CATEGORIAS,
  CLASIFICAR_MAX_ITEMS,
  CLASIFICAR_MIN_ITEMS,
} from './clasificar-config';

interface ClasificarPropertiesProps {
  actividad: ClasificarActivity;
  onChange: (actividad: ClasificarActivity) => void;
}

export function ClasificarProperties({ actividad, onChange }: ClasificarPropertiesProps) {
  const { configuracion, categorias, items } = actividad;

  const update = useCallback(
    (partial: Partial<ClasificarActivity>) => {
      onChange({ ...actividad, ...partial });
    },
    [actividad, onChange],
  );

  const updateConfig = useCallback(
    (partial: Partial<ClasificarActivity['configuracion']>) => {
      update({ configuracion: { ...configuracion, ...partial } });
    },
    [configuracion, update],
  );

  // Categorías
  const addCategoria = useCallback(() => {
    if (categorias.length >= CLASIFICAR_MAX_CATEGORIAS) return;
    const id = generarIdClasificar('cat');
    update({ categorias: [...categorias, { id, nombre: `Categoría ${categorias.length + 1}` }] });
  }, [categorias, update]);

  const removeCategoria = useCallback(
    (id: string) => {
      if (categorias.length <= CLASIFICAR_MIN_CATEGORIAS) return;
      const nuevasCats = categorias.filter((c) => c.id !== id);
      // Reasignar ítems huérfanos a primera categoría
      const nuevosItems = items.map((i) =>
        i.categoriaId === id ? { ...i, categoriaId: nuevasCats[0]!.id } : i,
      );
      update({ categorias: nuevasCats, items: nuevosItems });
    },
    [categorias, items, update],
  );

  const updateCategoria = useCallback(
    (id: string, partial: Partial<ClasificarCategoria>) => {
      update({ categorias: categorias.map((c) => (c.id === id ? { ...c, ...partial } : c)) });
    },
    [categorias, update],
  );

  // Items
  const addItem = useCallback(() => {
    if (items.length >= CLASIFICAR_MAX_ITEMS) return;
    const id = generarIdClasificar('item');
    update({
      items: [
        ...items,
        { id, texto: `Elemento ${items.length + 1}`, categoriaId: categorias[0]!.id },
      ],
    });
  }, [items, categorias, update]);

  const removeItem = useCallback(
    (id: string) => {
      if (items.length <= CLASIFICAR_MIN_ITEMS) return;
      update({ items: items.filter((i) => i.id !== id) });
    },
    [items, update],
  );

  const updateItem = useCallback(
    (id: string, partial: Partial<ClasificarItem>) => {
      update({ items: items.map((i) => (i.id === id ? { ...i, ...partial } : i)) });
    },
    [items, update],
  );

  const colores = configuracion.colorCategorias;

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      {/* Configuración */}
      <section>
        <h4 className="font-semibold text-gray-700 mb-2">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Columnas</span>
            <select
              value={configuracion.columnas}
              onChange={(e) => updateConfig({ columnas: Number(e.target.value) as 2 | 3 | 4 })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Permitir reintento</span>
            <input
              type="checkbox"
              checked={configuracion.permitirReintento}
              onChange={(e) => updateConfig({ permitirReintento: e.target.checked })}
            />
          </label>
        </div>
      </section>

      {/* Categorías */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Categorías</h4>
          <button
            onClick={addCategoria}
            disabled={categorias.length >= CLASIFICAR_MAX_CATEGORIAS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {categorias.map((cat, idx) => (
            <div key={cat.id} className="flex items-center gap-2">
              <input
                type="color"
                value={colores[idx % colores.length]}
                onChange={(e) => {
                  const nuevos = [...colores];
                  nuevos[idx] = e.target.value;
                  updateConfig({ colorCategorias: nuevos });
                }}
                className="w-7 h-7 rounded cursor-pointer border-0 p-0"
              />
              <input
                type="text"
                value={cat.nombre}
                onChange={(e) => updateCategoria(cat.id, { nombre: e.target.value })}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <button
                onClick={() => removeCategoria(cat.id)}
                disabled={categorias.length <= CLASIFICAR_MIN_CATEGORIAS}
                className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Elementos */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-700">Elementos</h4>
          <button
            onClick={addItem}
            disabled={items.length >= CLASIFICAR_MAX_ITEMS}
            className="text-xs px-2 py-1 rounded bg-[#2563EB] text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                value={item.texto}
                onChange={(e) => updateItem(item.id, { texto: e.target.value })}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
                placeholder="Texto del elemento"
              />
              <select
                value={item.categoriaId}
                onChange={(e) => updateItem(item.id, { categoriaId: e.target.value })}
                className="rounded border border-gray-300 px-1 py-1 text-xs max-w-[90px]"
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeItem(item.id)}
                disabled={items.length <= CLASIFICAR_MIN_ITEMS}
                className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-xs"
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
