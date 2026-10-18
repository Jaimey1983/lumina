'use client';

import type { ActivityBlock, Block, Slide } from '@lumina/types/slide';
import { elementRegistry } from '@/lib/element-registry-bootstrap';
import { RuletaProperties } from '@lumina/element-kit/widgets/ruleta/ruleta-properties';
import { normalizeRuletaBlock } from '@lumina/element-kit/widgets/ruleta/ruleta-defaults';
import {
  WidgetPropertiesPanelShell,
  WidgetPropertiesPanelStack,
} from '@lumina/editor-shared/widget-properties-panel';
import type { Animacion, TransicionSlide } from '@lumina/types/animation';
import type { ReactElement, ReactNode } from 'react';
import { PanelAnimaciones, PropertiesHeader, type ApplyNow } from './properties-panel-shared';

export interface ActividadPropertiesCtx {
  block: Block;
  applyNow: ApplyNow;
  applyAnimaciones: (animaciones: Animacion[]) => Promise<void>;
  applyTransicion: (transicion: TransicionSlide) => Promise<void>;
  slide: Slide | null;
  onApplySlide?: (patch: Partial<Slide>) => Promise<boolean>;
  motorSections: ReactNode;
}

/** Panel de propiedades de un bloque `actividad` (cada actividad con su cabecera propia). */
export function renderActividadProperties({
  block,
  applyNow,
  applyAnimaciones,
  applyTransicion,
  slide,
  onApplySlide,
  motorSections,
}: ActividadPropertiesCtx): ReactElement | null {
  const onChangeActividad = (updated: ActivityBlock['actividad']) => {
    void applyNow((b) => {
      if (b.tipo !== 'actividad') return b;
      return { ...b, actividad: updated };
    });
  };

  /** Panel de una actividad: cabecera con su nombre + editor + secciones del motor. */
  const panelActividad = (titulo: string, editor: ReactNode) => (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
      <PropertiesHeader title={titulo} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {editor}
        {motorSections}
      </div>
    </aside>
  );

  const animaciones = (b: Block) => (
    <PanelAnimaciones
      block={b}
      slide={slide}
      applyAnimaciones={applyAnimaciones}
      applyTransicion={applyTransicion}
      onApplySlide={onApplySlide}
    />
  );
  if (block.tipo === 'actividad') {
    const actBlock = block as ActivityBlock;
    const act = actBlock.actividad;

    if (act.tipo === 'ruleta') {
      return (
        <WidgetPropertiesPanelShell title="Ruleta">
          <WidgetPropertiesPanelStack>
            <RuletaProperties
              block={normalizeRuletaBlock(block)}
              applyNow={applyNow}
            />
            {animaciones(block)}
          </WidgetPropertiesPanelStack>
        </WidgetPropertiesPanelShell>
      );
    }

    // Despacho genérico: toda actividad registrada aporta su propio `Propiedades` (editor de
    // contenido + estilos + ajustes comunes). Sin lista fija: una actividad nueva no puede quedar
    // sin panel por olvido.
    const def = elementRegistry.obtener<ActivityBlock['actividad'], Record<string, unknown>>(act.tipo);
    if (def?.Propiedades) {
      return panelActividad(
        def.catalogo?.nombre ?? 'Propiedades',
        <def.Propiedades
          estado={act}
          config={{}}
          onConfigChange={() => {}}
          onChange={onChangeActividad}
        />,
      );
    }

    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
        <PropertiesHeader title="Propiedades" />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="p-4 text-sm text-muted-foreground">
            Esta actividad no tiene opciones de configuración.
          </p>
          {motorSections}
        </div>
      </aside>
    );
  }
  return null;
}
