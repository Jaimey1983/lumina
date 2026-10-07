'use client';

import { useEffect, useState } from 'react';
import type { Block, EquationBlock, EquationVinculo } from '@lumina/types/slide';
import { simbolosDeLatex } from '@lumina/editor-shared/rich-text/latex-render';
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
  /** Variables declaradas en la clase (M2). Sin ellas no hay nada que vincular. */
  variablesClase?: readonly { id: string; nombre: string; tipo: 'numero' | 'texto' | 'booleano' }[];
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
  variablesClase,
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

  const simbolos = simbolosDeLatex(latex);

  const setVinculos = (next: EquationVinculo[]) =>
    patch({ vinculos: next.length > 0 ? next : undefined });
  const setVinculo = (simbolo: string, variableId: string) => {
    const resto = (block.vinculos ?? []).filter((x) => x.simbolo !== simbolo);
    setVinculos(variableId === '' ? resto : [...resto, { simbolo, variableId }]);
  };
  const patchVinculo = (simbolo: string, partial: Partial<EquationVinculo>) =>
    setVinculos(
      (block.vinculos ?? []).map((x) => (x.simbolo === simbolo ? { ...x, ...partial } : x)),
    );

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

      <div className="space-y-2" data-ecuacion-interactividad="">
        <Label className="text-xs">Interactividad</Label>
        <label className="flex cursor-pointer items-start gap-2 text-xs">
          <Checkbox
            size="sm"
            className="mt-0.5"
            checked={block.pasos === true}
            onCheckedChange={(v) => patch({ pasos: v === true })}
          />
          Revelar la fórmula línea por línea (separa las líneas con \\)
        </label>
        <p className="text-[11px] text-muted-foreground" data-ecuacion-aviso-eventos="">
          {block.pasos === true
            ? 'Cada paso avisa a las interacciones (clic) y, al terminar, marca la fórmula como visitada.'
            : 'Sin «línea por línea» la fórmula no avisa a las interacciones: una regla de clic sobre ella no se activará.'}
        </p>
        <p className="text-[11px] text-muted-foreground" data-ecuacion-aviso-partes="">
          Para que una parte de la fórmula sea clicable, márcala con <code>{'\\parte{id}{…}'}</code>
          (por ejemplo <code>{'\\parte{a}{x^2}'}</code>) y crea una interacción «se hace clic en una
          parte». También se puede pulsar con teclado.
        </p>
        {simbolos.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Para que la fórmula cambie con una variable de la clase, escribe el símbolo entre
            dobles llaves: <code>{'{{a}}'}x^2</code>.
          </p>
        ) : (
          <div className="space-y-2">
            {simbolos.map((simbolo) => {
              const v = block.vinculos?.find((x) => x.simbolo === simbolo);
              const variable = variablesClase?.find((x) => x.id === v?.variableId);
              const numerica = variable?.tipo === 'numero';
              return (
                <div key={simbolo} className="space-y-1 rounded-md border border-border p-2">
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{`{{${simbolo}}}`}</code>
                    <select
                      aria-label={`Variable de ${simbolo}`}
                      className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs"
                      value={v?.variableId ?? ''}
                      onChange={(e) => setVinculo(simbolo, e.target.value)}
                    >
                      <option value="">Sin vincular (se ve «{simbolo}»)</option>
                      {(variablesClase ?? []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  {v && numerica ? (
                    <>
                      <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <Checkbox
                          size="sm"
                          checked={v.controlable === true}
                          onCheckedChange={(c) => patchVinculo(simbolo, { controlable: c === true })}
                        />
                        El alumno la cambia con − / +
                      </label>
                      {v.controlable === true ? (
                        <div className="grid grid-cols-3 gap-1">
                          {(['paso', 'min', 'max'] as const).map((campo) => (
                            <Input
                              key={campo}
                              type="number"
                              aria-label={`${campo} de ${simbolo}`}
                              placeholder={campo}
                              value={v[campo] ?? ''}
                              onChange={(e) =>
                                patchVinculo(simbolo, {
                                  [campo]:
                                    e.target.value === '' ? undefined : Number(e.target.value),
                                })
                              }
                              className="h-8 text-xs"
                            />
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              );
            })}
            {(variablesClase?.length ?? 0) === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                La clase no tiene variables. Decláralas en el panel «Variables».
              </p>
            ) : null}
          </div>
        )}
      </div>

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
