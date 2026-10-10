'use client';

import type {
  ActivityBlock,
  Block,
  ClasificarActivity,
  MemoriaActivity,
  PuzzleImagenActivity,
  SopaLetrasActivity,
  CrucigramaActivity,
  AbrirCajaActivity,
  AnagramaActivity,
  AhorcadoActivity,
  PuzzlePalabrasActivity,
  MatchPairs,
  GlobosActivity,
  TopoActivity,
  HistoriaRamificadaActivity,
  Slide,
} from '@lumina/types/slide';
import { ClasificarProperties } from '@lumina/element-kit/activities/clasificar/clasificar-properties';
import { MemoriaProperties } from '@lumina/element-kit/activities/memoria/memoria-properties';
import {
  PuzzleImagenProperties,
} from '@lumina/element-kit/activities/puzzle-imagen/puzzle-imagen-properties';
import { SopaLetrasProperties } from '@lumina/element-kit/activities/sopa-letras/sopa-letras-properties';
import { CrucigramaProperties } from '@lumina/element-kit/activities/crucigrama/crucigrama-properties';
import { AbrirCajaProperties } from '@lumina/element-kit/activities/abrir-caja/abrir-caja-properties';
import { AnagramaProperties } from '@lumina/element-kit/activities/anagrama/anagrama-properties';
import { AhorcadoProperties } from '@lumina/element-kit/activities/ahorcado/ahorcado-properties';
import {
  PuzzlePalabrasProperties,
} from '@lumina/element-kit/activities/puzzle-palabras/puzzle-palabras-properties';
import { EmparejarProperties } from '@lumina/element-kit/activities/emparejar/emparejar-properties';
import { GlobosProperties } from '@lumina/element-kit/activities/globos/globos-properties';
import { TopoProperties } from '@lumina/element-kit/activities/topo/topo-properties';
import { RuletaProperties } from '@lumina/element-kit/widgets/ruleta/ruleta-properties';
import { normalizeRuletaBlock } from '@lumina/element-kit/widgets/ruleta/ruleta-defaults';
import { HistoriaRamificadaProperties } from '@lumina/element-kit/activities/historia-ramificada/historia-ramificada-properties';
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

    if (act.tipo === 'emparejar') {
      return panelActividad(
        'Emparejar',
        <EmparejarProperties actividad={act as MatchPairs} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'clasificar') {
      return panelActividad(
        'Clasificar',
        <ClasificarProperties actividad={act as ClasificarActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'memoria') {
      return panelActividad(
        'Memoria',
        <MemoriaProperties actividad={act as MemoriaActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'puzzle_imagen') {
      return panelActividad(
        'Puzzle de imagen',
        <PuzzleImagenProperties actividad={act as PuzzleImagenActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'sopa_letras') {
      return panelActividad(
        'Sopa de letras',
        <SopaLetrasProperties actividad={act as SopaLetrasActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'crucigrama') {
      return panelActividad(
        'Crucigrama',
        <CrucigramaProperties actividad={act as CrucigramaActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'abrir_caja') {
      return panelActividad(
        'Abrir caja',
        <AbrirCajaProperties actividad={act as AbrirCajaActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'anagrama') {
      return panelActividad(
        'Anagrama',
        <AnagramaProperties actividad={act as AnagramaActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'ahorcado') {
      return panelActividad(
        'Ahorcado',
        <AhorcadoProperties actividad={act as AhorcadoActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'puzzle_palabras') {
      return panelActividad(
        'Puzzle de palabras',
        <PuzzlePalabrasProperties actividad={act as PuzzlePalabrasActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'globos') {
      return panelActividad(
        'Globos',
        <GlobosProperties actividad={act as GlobosActivity} onChange={onChangeActividad} />,
      );
    }

    if (act.tipo === 'topo') {
      return panelActividad(
        'Golpea al topo',
        <TopoProperties actividad={act as TopoActivity} onChange={onChangeActividad} />,
      );
    }

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

    if (act.tipo === 'historia_ramificada') {
      return panelActividad(
        'Historia Ramificada',
        <HistoriaRamificadaProperties actividad={act as HistoriaRamificadaActivity} onChange={onChangeActividad} />,
      );
    }

    return (
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
        <PropertiesHeader title="Propiedades" />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="p-4 text-sm text-muted-foreground">
            Las actividades se configuran en el panel lateral derecho.
          </p>
          {motorSections}
        </div>
      </aside>
    );
  }
  return null;
}
