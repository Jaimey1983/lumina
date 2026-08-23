'use client';

import React, { useCallback, useRef } from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';
import type { MemoriaActivity } from '@/types/slide.types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  generarIdMemoria,
  MEMORIA_MAX_PARES,
  MEMORIA_MIN_PARES,
} from './memoria-config';
import type { MemoriaLado } from './memoria-shared';

interface MemoriaPropertiesProps {
  actividad: MemoriaActivity;
  onChange: (actividad: MemoriaActivity) => void;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read'));
    reader.readAsDataURL(file);
  });
}

function CampoLado({
  label,
  lado,
  onChange,
}: {
  label: string;
  lado: MemoriaLado;
  onChange: (lado: MemoriaLado) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await readFileAsDataURL(file);
    onChange({ ...lado, imagen: dataUrl });
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-gray-200 bg-white p-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        type="text"
        value={lado.texto ?? ''}
        onChange={(e) =>
          onChange({ ...lado, texto: e.target.value || undefined })
        }
        placeholder="Texto o emoji"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
      />
      <input
        type="text"
        value={lado.imagen ?? ''}
        onChange={(e) =>
          onChange({ ...lado, imagen: e.target.value.trim() || undefined })
        }
        placeholder="URL de imagen (https://…)"
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-600"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[10px]"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-3" />
          Subir imagen
        </Button>
        {lado.imagen ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px] text-red-500 hover:text-red-600"
            onClick={() => onChange({ ...lado, imagen: undefined })}
          >
            <X className="size-3" />
            Quitar
          </Button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {lado.imagen ? (
        <div className="flex items-center gap-2 rounded border border-gray-100 bg-gray-50 p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lado.imagen}
            alt={lado.texto ?? 'Vista previa'}
            className="h-12 w-12 shrink-0 rounded object-contain"
          />
          <span className="text-[10px] leading-snug text-gray-500">
            {lado.imagen.startsWith('data:') ? 'Imagen subida' : 'Imagen por URL'}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <ImageIcon className="size-3 shrink-0" />
          Texto, emoji o imagen en cada cara
        </div>
      )}
    </div>
  );
}

export function MemoriaProperties({ actividad, onChange }: MemoriaPropertiesProps) {
  const { configuracion, pares } = actividad;

  const update = useCallback(
    (partial: Partial<MemoriaActivity>) => {
      onChange({ ...actividad, ...partial });
    },
    [actividad, onChange],
  );

  const updateConfig = useCallback(
    (partial: Partial<MemoriaActivity['configuracion']>) => {
      update({ configuracion: { ...configuracion, ...partial } });
    },
    [configuracion, update],
  );

  const addPar = useCallback(() => {
    if (pares.length >= MEMORIA_MAX_PARES) return;
    const id = generarIdMemoria('par');
    update({
      pares: [...pares, { id, lado1: { texto: 'Cara A' }, lado2: { texto: 'Cara B' } }],
    });
  }, [pares, update]);

  const removePar = useCallback(
    (id: string) => {
      if (pares.length <= MEMORIA_MIN_PARES) return;
      update({ pares: pares.filter((p) => p.id !== id) });
    },
    [pares, update],
  );

  const updateParLado = useCallback(
    (id: string, lado: 'lado1' | 'lado2', next: MemoriaLado) => {
      update({
        pares: pares.map((p) => (p.id === id ? { ...p, [lado]: next } : p)),
      });
    },
    [pares, update],
  );

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      <section>
        <h4 className="mb-2 font-semibold text-gray-700">Configuración</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Columnas</span>
            <select
              value={configuracion.columnas}
              onChange={(e) =>
                updateConfig({ columnas: Number(e.target.value) as 2 | 3 | 4 })
              }
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Color de dorso</span>
            <input
              type="color"
              value={configuracion.colorDorso}
              onChange={(e) => updateConfig({ colorDorso: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border-0 p-0"
            />
          </label>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mem-simbolo" className="text-gray-600">
              Símbolo del dorso
            </Label>
            <input
              id="mem-simbolo"
              type="text"
              value={configuracion.simboloDorso ?? '?'}
              onChange={(e) => updateConfig({ simboloDorso: e.target.value })}
              placeholder="?"
              maxLength={4}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
            />
            <p className="text-[10px] leading-snug text-gray-400">
              Texto o emoji visible en cartas boca abajo (p. ej. ?, ★, Lumina)
            </p>
          </div>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Color del símbolo</span>
            <input
              type="color"
              value={configuracion.colorSimboloDorso ?? '#FFFFFF'}
              onChange={(e) => updateConfig({ colorSimboloDorso: e.target.value })}
              className="h-7 w-7 cursor-pointer rounded border-0 p-0"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Tiempo de volteo (ms)</span>
            <select
              value={configuracion.tiempoVolteo}
              onChange={(e) => updateConfig({ tiempoVolteo: Number(e.target.value) })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={600}>Rápido (0.6s)</option>
              <option value={1000}>Normal (1s)</option>
              <option value={1500}>Lento (1.5s)</option>
              <option value={2000}>Muy lento (2s)</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Mostrar cronómetro</span>
            <input
              type="checkbox"
              checked={configuracion.mostrarTimer}
              onChange={(e) => updateConfig({ mostrarTimer: e.target.checked })}
            />
          </label>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">Pares ({pares.length})</h4>
          <button
            type="button"
            onClick={addPar}
            disabled={pares.length >= MEMORIA_MAX_PARES}
            className="rounded bg-[#2563EB] px-2 py-1 text-xs text-white disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
        <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
          {pares.map((par, idx) => (
            <div
              key={par.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
            >
              <div className="mb-0.5 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Par {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removePar(par.id)}
                  disabled={pares.length <= MEMORIA_MIN_PARES}
                  className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
              <CampoLado
                label="Cara A"
                lado={par.lado1}
                onChange={(lado) => updateParLado(par.id, 'lado1', lado)}
              />
              <CampoLado
                label="Cara B"
                lado={par.lado2}
                onChange={(lado) => updateParLado(par.id, 'lado2', lado)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
