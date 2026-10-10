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
import {
  HistoriaRamificadaProperties,
} from '@lumina/element-kit/activities/historia-ramificada/historia-ramificada-properties';
import {
  WidgetPropertiesPanelBlock,
  WidgetPropertiesPanelShell,
  WidgetPropertiesPanelStack,
} from '@lumina/editor-shared/widget-properties-panel';
import { AnimationPanel } from '@/components/animations/animation-panel';
import type { Animacion, TransicionSlide } from '@lumina/types/animation';
import type { ReactElement, ReactNode } from 'react';
import { PropertiesHeader, type ApplyNow } from './properties-panel-shared';

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
  if (block.tipo === 'actividad') {
    const actBlock = block as ActivityBlock;
    const act = actBlock.actividad;

    if (act.tipo === 'emparejar') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Emparejar" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EmparejarProperties
              actividad={act as MatchPairs}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'clasificar') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Clasificar" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ClasificarProperties
              actividad={act as ClasificarActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'memoria') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Memoria" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <MemoriaProperties
              actividad={act as MemoriaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'puzzle_imagen') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Puzzle de imagen" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PuzzleImagenProperties
              actividad={act as PuzzleImagenActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'sopa_letras') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Sopa de letras" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SopaLetrasProperties
              actividad={act as SopaLetrasActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'crucigrama') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Crucigrama" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <CrucigramaProperties
              actividad={act as CrucigramaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'abrir_caja') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Abrir caja" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AbrirCajaProperties
              actividad={act as AbrirCajaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'anagrama') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Anagrama" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AnagramaProperties
              actividad={act as AnagramaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'ahorcado') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Ahorcado" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AhorcadoProperties
              actividad={act as AhorcadoActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'puzzle_palabras') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Puzzle de palabras" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PuzzlePalabrasProperties
              actividad={act as PuzzlePalabrasActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'globos') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Globos" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <GlobosProperties
              actividad={act as GlobosActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
      );
    }

    if (act.tipo === 'topo') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Golpea al topo" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TopoProperties
              actividad={act as TopoActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
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
            <WidgetPropertiesPanelBlock>
              <AnimationPanel
                block={block}
                slide={slide}
                onUpdateAnimaciones={(animaciones) => void applyAnimaciones(animaciones)}
                onUpdateTransicion={onApplySlide ? (t) => void applyTransicion(t) : undefined}
              />
            </WidgetPropertiesPanelBlock>
          </WidgetPropertiesPanelStack>
        </WidgetPropertiesPanelShell>
      );
    }

    if (act.tipo === 'historia_ramificada') {
      return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-background">
          <PropertiesHeader title="Historia Ramificada" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <HistoriaRamificadaProperties
              actividad={act as HistoriaRamificadaActivity}
              onChange={(updated) => {
                void applyNow((b) => {
                  if (b.tipo !== 'actividad') return b;
                  return { ...b, actividad: updated };
                });
              }}
            />
            {motorSections}
          </div>
        </aside>
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
