'use client';

import { useEffect, useState } from 'react';
import type { Block, EquationBlock } from '@lumina/types/slide';
import { EquationComposer } from '@lumina/editor-shared/rich-text/equation-composer';
import { Checkbox } from '@lumina/ui/checkbox';
import { Input } from '@lumina/ui/input';
import { Label } from '@lumina/ui/label';
import { Slider, SliderThumb } from '@lumina/ui/slider';
import {
  ECUACION_TAMANO_MAX,
  ECUACION_TAMANO_MIN,
  ecuacionTamano,
} from './ecuacion-defaults.js';

export interface EcuacionPropertiesProps {
  block: EquationBlock;
  applyNow?: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply?: (fn: (b: Block) => Block) => void;
  clearDebounce?: () => void;
  onChange?: (updated: EquationBlock) => void;
}

const ALINEACIONES: { value: NonNullable<EquationBlock['alineacion']>; label: string }[] = [
  { value: 'izquierda', label: 'Izquierda' },
  { value: 'centro', label: 'Centro' },
  { value: 'derecha', label: 'Derecha' },
];

function toHex(color: string | undefined, fallback: string): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

/**
 * Panel de la ecuación: el compositor (teclado visual + vista previa + errores)
 * edita la fórmula en vivo; debajo, tamaño, color, alineación, fondo y ajuste.
 */
export function EcuacionProperties({
  block,
  applyNow,
  scheduleApply,
  onChange,
}: EcuacionPropertiesProps) {
  const [latex, setLatex] = useState(block.latex ?? '');
  const [tamano, setTamano] = useState(() => ecuacionTamano(block));

  useEffect(() => {
    setLatex((prev) => (prev === (block.latex ?? '') ? prev : (block.latex ?? '')));
  }, [block.latex]);
  useEffect(() => {
    setTamano(ecuacionTamano(block));
  }, [block]);

  const patch = (partial: Partial<EquationBlock>, debounced = false) => {
    const fn = (b: Block): Block => (b.tipo === 'ecuacion' ? { ...b, ...partial } : b);
    if (debounced && scheduleApply) scheduleApply(fn);
    else if (applyNow) void applyNow(fn);
    else if (onChange) onChange({ ...block, ...partial });
  };

  return (
    <div className="flex flex-col gap-4" data-ecuacion-properties="">
      <div className="space-y-2">
        <Label className="text-xs">Fórmula</Label>
        <EquationComposer
          value={latex}
          density="panel"
          onChange={(next) => {
            setLatex(next);
            patch({ latex: next }, true);
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs">Tamaño</Label>
          <span className="text-xs tabular-nums text-muted-foreground">{tamano}px</span>
        </div>
        <Slider
          value={[tamano]}
          min={ECUACION_TAMANO_MIN}
          max={ECUACION_TAMANO_MAX}
          step={1}
          onValueChange={([v]) => {
            const n = Math.round(v!);
            setTamano(n);
            patch({ tamano: n }, true);
          }}
        >
          <SliderThumb />
        </Slider>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Alineación</Label>
        <div className="grid grid-cols-3 gap-1">
          {ALINEACIONES.map((a) => {
            const active = (block.alineacion ?? 'centro') === a.value;
            return (
              <button
                key={a.value}
                type="button"
                aria-pressed={active}
                onClick={() => patch({ alineacion: a.value })}
                className={
                  active
                    ? 'rounded-md border border-primary bg-primary/10 px-2 py-1 text-xs font-medium text-primary'
                    : 'rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground'
                }
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs" htmlFor="prop-ecuacion-color">
            Color
          </Label>
          <Input
            id="prop-ecuacion-color"
            type="color"
            value={toHex(block.color, '#0f172a')}
            onChange={(e) => patch({ color: e.target.value }, true)}
            className="h-8 w-full cursor-pointer p-1"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs" htmlFor="prop-ecuacion-fondo">
            Fondo
          </Label>
          <div className="flex items-center gap-1">
            <Input
              id="prop-ecuacion-fondo"
              type="color"
              value={toHex(block.fondo, '#ffffff')}
              onChange={(e) => patch({ fondo: e.target.value }, true)}
              className="h-8 w-full cursor-pointer p-1"
            />
            {block.fondo ? (
              <button
                type="button"
                title="Quitar fondo"
                aria-label="Quitar fondo"
                onClick={() => patch({ fondo: '' })}
                className="h-8 rounded-md border border-border px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs leading-snug text-muted-foreground">
        <Checkbox
          size="sm"
          className="mt-0.5"
          checked={block.ajustar !== false}
          onCheckedChange={(v) => patch({ ajustar: v === true })}
        />
        Reducir la fórmula para que quepa en la caja
      </label>

      <div className="space-y-2">
        <Label className="text-xs" htmlFor="prop-ecuacion-desc">
          Descripción para lectores de pantalla
        </Label>
        <Input
          id="prop-ecuacion-desc"
          type="text"
          autoComplete="off"
          value={block.descripcionAccesible ?? ''}
          placeholder="Ej.: fórmula general de la ecuación cuadrática"
          onChange={(e) => patch({ descripcionAccesible: e.target.value }, true)}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
