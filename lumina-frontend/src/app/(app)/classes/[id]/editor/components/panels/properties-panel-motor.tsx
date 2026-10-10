'use client';

import { useEffect, useState } from 'react';
import { asegurarIdBloque } from '@lumina/editor-shared/block-id';
import type { EstadoObjeto } from '@lumina/types/interaction';
import type { ReferenciaRota, ReglaAplicable } from '@lumina/interactions';
import { BlockStatesSection } from './block-states-section';
import { InteractionsPanel } from './interactions-panel';
import type { Block, Slide } from '@lumina/types/slide';
import { withRotation } from '@/hooks/use-block-drag';
import { RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@lumina/ui/button';
import { Input } from '@lumina/ui/input';
import { FieldHelp } from '@lumina/ui/field-help';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { Label } from '@lumina/ui/label';
import { Slider, SliderThumb } from '@lumina/ui/slider';
import type { ApplyNow } from './properties-panel-shared';

export interface MotorSectionsProps {
  block: Block;
  bloques: Block[];
  selectedBlockId: string;
  slide: Slide;
  slidesDelMazo: { id: string; titulo: string }[];
  referenciasRotas: ReferenciaRota[];
  reglasDelMazo: ReglaAplicable[];
  applyNow: ApplyNow;
  onApplyBloques: (next: Block[]) => Promise<boolean>;
}

/** K6/K7b — «Estado inicial», «Estados» e «Interacciones» de un bloque con eventos. */
export function MotorSections({
  block,
  bloques,
  selectedBlockId,
  slide,
  slidesDelMazo,
  referenciasRotas,
  reglasDelMazo,
  applyNow,
  onApplyBloques,
}: MotorSectionsProps) {
  return (
    <>
      <BlockEstadoInicialSection
        estado={(block as { estado?: EstadoObjeto }).estado ?? 'normal'}
        applyNow={applyNow}
      />
      <BlockStatesSection
        block={block}
        reglas={reglasDelMazo}
        tituloDeSlide={(id) => slidesDelMazo.find((x) => x.id === id)?.titulo}
        applyNow={applyNow}
      />
      <InteractionsPanel
        bloques={bloques}
        blockPath={selectedBlockId}
        slideId={slide.id}
        slidesDelMazo={slidesDelMazo}
        referenciasRotas={referenciasRotas}
        capas={slide.capas}
        onApplyBloques={onApplyBloques}
      />
    </>
  );
}

const ESTADOS_INICIALES: Array<{ value: EstadoObjeto; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'deshabilitado', label: 'Deshabilitado (no responde a clics)' },
  { value: 'visitado', label: 'Visitado' },
  { value: 'seleccionado', label: 'Seleccionado' },
];

/**
 * Etapa K / K6 — estado inicial del objeto para el motor de interacción.
 * Solo «Deshabilitado» tiene efecto visual en v1; «Visitado» y «Seleccionado»
 * se usan como condición de las reglas (aún sin apariencia propia).
 * Asigna un id estable al bloque la primera vez que se toca (D8).
 */
export function BlockEstadoInicialSection({
  estado,
  applyNow,
}: {
  estado: EstadoObjeto;
  applyNow: ApplyNow;
}) {
  return (
    <CollapsibleSection
      title="Estado inicial (interacción)"
      defaultOpen={false}
      storageKey="props.estado-inicial"
      badge={estado !== 'normal' ? ESTADOS_INICIALES.find((o) => o.value === estado)?.label.split(' (')[0] : undefined}
      forceOpen={estado !== 'normal'}
      className="mt-4 border-t border-border pt-4"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs font-medium">Estado inicial (interacción)</Label>
          <FieldHelp label="Estado inicial">
            <p>
              Solo «Deshabilitado» cambia la apariencia. «Visitado» y «Seleccionado» sirven como
              condición en las reglas.
            </p>
          </FieldHelp>
        </div>
        <select
          value={estado}
          onChange={(e) => {
            const next = e.target.value as EstadoObjeto;
            void applyNow((b) => {
              const conId = asegurarIdBloque(b);
              if (next === 'normal') {
                const { estado: _omit, ...rest } = conId as Block & { estado?: EstadoObjeto };
                void _omit;
                return rest as Block;
              }
              return { ...conId, estado: next } as Block;
            });
          }}
          className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
        >
          {ESTADOS_INICIALES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </CollapsibleSection>
  );
}

export function BlockRotationSection({
  rotacion = 0,
  applyNow,
  scheduleApply,
}: {
  rotacion?: number;
  applyNow: ApplyNow;
  scheduleApply: (fn: (b: Block) => Block) => void;
}) {
  const [localAngle, setLocalAngle] = useState(rotacion);

  useEffect(() => {
    setLocalAngle(rotacion);
  }, [rotacion]);

  const updateAngle = (angle: number, immediate = false) => {
    const normalized = Math.round((((angle % 360) + 360) % 360) * 10) / 10;
    setLocalAngle(normalized);
    if (immediate) {
      void applyNow((b) => withRotation(b, normalized));
    } else {
      scheduleApply((b) => withRotation(b, normalized));
    }
  };

  return (
    <CollapsibleSection
      title="Rotación"
      defaultOpen={false}
      storageKey="props.rotacion"
      badge={`${Math.round(localAngle)}°`}
      forceOpen={Math.round(localAngle) !== 0}
      className="mt-4 border-t border-border pt-4"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Rotación</Label>
          <span className="text-xs tabular-nums text-muted-foreground">{Math.round(localAngle)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <Slider
            value={[localAngle]}
            min={0}
            max={360}
            step={1}
            onValueChange={([v]) => updateAngle(v ?? 0)}
            className="flex-1"
          >
            <SliderThumb />
          </Slider>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={360}
              value={Math.round(localAngle)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) updateAngle(val);
              }}
              onBlur={() => updateAngle(localAngle, true)}
              className="h-7 w-14 px-1 text-center text-xs tabular-nums"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 flex-1 px-1 text-[10px]"
            onClick={() => updateAngle(localAngle - 90, true)}
            title="Girar -90°"
          >
            <RotateCcw className="mr-0.5 size-3" />
            -90°
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 flex-1 px-1 text-[10px]"
            onClick={() => updateAngle(0, true)}
            title="Restablecer a 0°"
          >
            0°
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 flex-1 px-1 text-[10px]"
            onClick={() => updateAngle(localAngle + 90, true)}
            title="Girar +90°"
          >
            <RotateCw className="mr-0.5 size-3" />
            +90°
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 flex-1 px-1 text-[10px]"
            onClick={() => updateAngle(localAngle + 180, true)}
            title="Girar 180°"
          >
            180°
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
