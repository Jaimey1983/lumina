'use client';

import { toast } from 'sonner';
import {
  BarChart2,
  BarChartHorizontal,
  BookOpen,
  Brain,
  CircleDot,
  Columns2,
  Gauge,
  GitMerge,
  Grid,
  LineChart,
  Milestone,
  Minus,
  Network,
  Quote,
  ScatterChart,
  Video,
  Volume2,
  Workflow,
  Triangle,
  Filter,
  Disc,
  GitFork,
  HeartHandshake,
  Sigma,
  FlaskConical,
  TableProperties,
  Atom,
  TestTube2,
} from 'lucide-react';
import type { Block } from '@lumina/types/slide';
import { createDefaultGraficoBlock } from '@lumina/element-kit/blocks/grafico/grafico-defaults';
import { GRAFICO_TEMPLATES } from '@lumina/element-kit/blocks/grafico/grafico-templates';
import {
  createDefaultCronologiaBlock,
  createDefaultFlujoBlock,
  createDefaultMapaConceptualBlock,
  createDefaultMapaMentalBlock,
  createDefaultOrganigramaBlock,
  createDefaultVennBlock,
  createDefaultFrayerBlock,
  createDefaultIshikawaBlock,
  createDefaultCicloBlock,
  createDefaultMatriz2x2Block,
  createDefaultTablaTBlock,
  createDefaultPiramideBlock,
  createDefaultEmbudoBlock,
  createDefaultCebollaBlock,
  createDefaultArbolProblemasBlock,
  createDefaultEisenhowerBlock,
  createDefaultEmpatiaBlock,
} from '@lumina/element-kit/blocks/diagrama/diagrama-defaults';
import { appendBlockToSlideContent } from '@/lib/class-slide-normalize';
import { ScrollArea } from '@lumina/ui/scroll-area';
import { createDefaultSeparadorBlock } from '@lumina/element-kit/blocks/separador/divider-defaults';
import { createDefaultEcuacionBlock } from '@lumina/element-kit/blocks/ecuacion/ecuacion-defaults';
import { createTextBlock } from '@lumina/element-kit/blocks/texto/texto-defaults';
import { ImagesElementPanel } from './images-element-panel';
import { ClipMasksPanel } from './clip-masks-panel';
import {
  CHEMISTRY_EQUATION_PRESETS,
  CHEMISTRY_QUICK_ACTIVITIES,
  CHEMISTRY_SLIDE_TEMPLATES,
  createChemistryEquationBlock,
} from '@lumina/element-kit/chemistry/chemistry-slide-templates';
import {
  CHEMISTRY_LAB_SLIDE_TEMPLATES,
  type ChemistryLabSlideTemplate,
} from '@lumina/element-kit/chemistry/chemistry-lab-templates';
import {
  createDefaultTablaPeriodicaBlock,
} from '@lumina/element-kit/widgets/tabla_periodica/tabla-periodica-defaults';
import { createDefaultMoleculaBlock } from '@lumina/element-kit/widgets/molecula/molecula-defaults';
import { CollapsibleSection } from '@lumina/ui/collapsible-section';
import { PanelSection, InsertBtn, type ContentPanelProps } from './panel-shared';

function isLabSlideTemplate(
  tmpl: (typeof CHEMISTRY_SLIDE_TEMPLATES)[number],
): tmpl is ChemistryLabSlideTemplate {
  return CHEMISTRY_LAB_SLIDE_TEMPLATES.some((l) => l.id === tmpl.id);
}

const DIAGRAMAS: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  create: () => Block;
}> = [
  { label: "Mapa Mental", icon: Brain, create: createDefaultMapaMentalBlock },
  { label: "Organigrama", icon: Network, create: createDefaultOrganigramaBlock },
  { label: "Mapa Conceptual", icon: Workflow, create: createDefaultMapaConceptualBlock },
  { label: "Flujo de Procesos", icon: GitMerge, create: createDefaultFlujoBlock },
  { label: "Diagrama de Venn", icon: CircleDot, create: createDefaultVennBlock },
  { label: "Cronología pedagógica", icon: Milestone, create: createDefaultCronologiaBlock },
  { label: "Modelo Frayer", icon: BookOpen, create: createDefaultFrayerBlock },
  { label: "Ishikawa (Causa-Efecto)", icon: GitMerge, create: createDefaultIshikawaBlock },
  { label: "Ciclo Continuo", icon: CircleDot, create: createDefaultCicloBlock },
  { label: "Matriz 2×2", icon: Grid, create: createDefaultMatriz2x2Block },
  { label: "Tabla T (Pros y Contras)", icon: Columns2, create: createDefaultTablaTBlock },
  { label: "Pirámide Jerárquica", icon: Triangle, create: createDefaultPiramideBlock },
  { label: "Embudo / Proceso", icon: Filter, create: createDefaultEmbudoBlock },
  { label: "Círculos Concéntricos", icon: Disc, create: createDefaultCebollaBlock },
  { label: "Árbol de Problemas", icon: GitFork, create: createDefaultArbolProblemasBlock },
  { label: "Matriz Eisenhower", icon: Grid, create: createDefaultEisenhowerBlock },
  { label: "Mapa de Empatía", icon: HeartHandshake, create: createDefaultEmpatiaBlock },
];

export function ElementosPanel({
  apiSlide,
  onCommitContent,
  disabled,
  slideHasActivity,
  onInsertBlock,
  onAddWidget,
  onCreateActivitySlide,
  onAddActivity,
  onMergeClassVariables,
}: ContentPanelProps) {
  const add = (block: Block) => {
    if (onInsertBlock) {
      void onInsertBlock(block).then((ok) => {
        if (ok) toast.success('Elemento añadido');
      });
      return;
    }
    onCommitContent(appendBlockToSlideContent(apiSlide, block));
    toast.success('Elemento añadido');
  };

  const insertImage = onInsertBlock
    ?? (async (block: Block) => {
      onCommitContent(appendBlockToSlideContent(apiSlide, block));
      return true;
    });

  const disabledNonText = disabled || !!slideHasActivity;

  const addBlocksSequential = async (blocks: Block[]) => {
    for (const block of blocks) {
      if (onInsertBlock) {
        const ok = await onInsertBlock(block);
        if (!ok) return;
      } else {
        onCommitContent(appendBlockToSlideContent(apiSlide, block));
      }
    }
    toast.success('Plantilla química añadida al slide');
  };

  return (
    <ScrollArea className="h-full min-h-0 bg-white dark:bg-zinc-900">
      <div className="space-y-4 p-3 pr-2">
        {slideHasActivity && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            Solo puedes agregar texto (título) a este slide.
          </p>
        )}
        <ImagesElementPanel
          onInsert={insertImage}
          disabled={disabledNonText}
        />
        <ClipMasksPanel apiSlide={apiSlide} onCommitContent={onCommitContent} disabled={disabledNonText} />
        <PanelSection
          title="Gráficos de Datos"
          storageKey="elementos.graficos"
          badge={7 + GRAFICO_TEMPLATES.length}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <InsertBtn
              label="Comparación"
              icon={BarChart2}
              disabled={disabledNonText}
              onClick={() =>
                add(
                  createDefaultGraficoBlock({
                    chartType: 'column',
                    titulo: 'Comparación de datos',
                  }),
                )
              }
            />
            <InsertBtn
              label="Evolución"
              icon={LineChart}
              disabled={disabledNonText}
              onClick={() =>
                add(
                  createDefaultGraficoBlock({
                    chartType: 'line',
                    titulo: 'Evolución en el tiempo',
                  }),
                )
              }
            />
            <InsertBtn
              label="Proporción"
              icon={CircleDot}
              disabled={disabledNonText}
              onClick={() =>
                add(
                  createDefaultGraficoBlock({
                    chartType: 'donut',
                    titulo: 'Distribución y proporción',
                  }),
                )
              }
            />
            <InsertBtn
              label="Relación"
              icon={ScatterChart}
              disabled={disabledNonText}
              onClick={() =>
                add(
                  createDefaultGraficoBlock({
                    chartType: 'scatter',
                    titulo: 'Relación y dispersión',
                  }),
                )
              }
            />
            <InsertBtn
              label="Estadística"
              icon={BarChartHorizontal}
              disabled={disabledNonText}
              onClick={() =>
                add(
                  createDefaultGraficoBlock({
                    chartType: 'histogram',
                    titulo: 'Distribución estadística',
                  }),
                )
              }
            />
            <InsertBtn
              label="Progreso / KPI"
              icon={Gauge}
              disabled={disabledNonText}
              onClick={() =>
                add(
                  createDefaultGraficoBlock({
                    chartType: 'radialBar',
                    titulo: 'Progreso y métricas',
                  }),
                )
              }
            />
            <InsertBtn
              label="Especiales"
              icon={Grid}
              disabled={disabledNonText}
              onClick={() =>
                add(
                  createDefaultGraficoBlock({
                    chartType: 'heatmap',
                    titulo: 'Matriz especial',
                  }),
                )
              }
            />
          </div>

          <CollapsibleSection
            title="Plantillas Pedagógicas"
            icon={BookOpen}
            defaultOpen={false}
            storageKey="elementos.graficos.plantillas"
            badge={GRAFICO_TEMPLATES.length}
            className="mt-2.5 pt-2 border-t border-border/50"
          >
            <div className="space-y-1">
              {GRAFICO_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  disabled={disabledNonText}
                  onClick={() => add(tmpl.buildBlock())}
                  className="w-full text-left p-1.5 rounded-md hover:bg-muted/70 transition-colors border border-transparent hover:border-border/60 disabled:opacity-50 disabled:pointer-events-none group"
                >
                  <div className="text-[11px] font-medium text-foreground group-hover:text-primary leading-tight">
                    {tmpl.nombre}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1 leading-tight mt-0.5">
                    {tmpl.descripcion}
                  </div>
                </button>
              ))}
            </div>
          </CollapsibleSection>
        </PanelSection>
        <PanelSection
          title="Diagramas"
          storageKey="elementos.diagramas"
          defaultOpen={false}
          badge={DIAGRAMAS.length}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {DIAGRAMAS.map((d) => (
              <InsertBtn
                key={d.label}
                label={d.label}
                icon={d.icon}
                disabled={disabledNonText}
                onClick={() => add(d.create())}
              />
            ))}
          </div>
        </PanelSection>
        <PanelSection
          title="Química"
          storageKey="elementos.quimica"
          defaultOpen={false}
          badge={
            3 +
            CHEMISTRY_QUICK_ACTIVITIES.length +
            CHEMISTRY_EQUATION_PRESETS.length +
            CHEMISTRY_SLIDE_TEMPLATES.length +
            1
          }
        >
          <div className="grid grid-cols-2 gap-1.5">
            <InsertBtn
              label="Tabla periódica"
              icon={TableProperties}
              disabled={disabledNonText}
              onClick={() => {
                if (onAddWidget) {
                  onAddWidget('tabla_periodica');
                  return;
                }
                add(createDefaultTablaPeriodicaBlock());
              }}
            />
            <InsertBtn
              label="Molécula 2D"
              icon={Atom}
              disabled={disabledNonText}
              onClick={() => {
                if (onAddWidget) {
                  onAddWidget('molecula');
                  return;
                }
                add(createDefaultMoleculaBlock());
              }}
            />
            <InsertBtn
              label="Ecuación \\ce{} (ejemplo)"
              icon={TestTube2}
              disabled={disabledNonText}
              onClick={() => add(createChemistryEquationBlock(CHEMISTRY_EQUATION_PRESETS[0].latex))}
            />
            {CHEMISTRY_QUICK_ACTIVITIES.map((act) => (
              <InsertBtn
                key={act.id}
                label={act.label}
                icon={
                  act.id === 'balancear-ecuacion'
                    ? FlaskConical
                    : act.id === 'ubicar-elemento'
                      ? TableProperties
                      : Atom
                }
                disabled={disabled || !!slideHasActivity}
                onClick={() => {
                  if (onAddActivity) {
                    onAddActivity(act.id);
                    return;
                  }
                  toast.error('No se pudo insertar la actividad');
                }}
              />
            ))}
          </div>
          <CollapsibleSection
            title="Ecuaciones rápidas (mhchem)"
            defaultOpen={false}
            storageKey="elementos.quimica.ecuaciones"
            badge={CHEMISTRY_EQUATION_PRESETS.length}
            className="mt-2"
          >
            <div className="space-y-1">
            {CHEMISTRY_EQUATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={disabledNonText}
                onClick={() => add(createChemistryEquationBlock(preset.latex))}
                className="w-full rounded-md border border-transparent px-2 py-1.5 text-left text-[11px] hover:border-border hover:bg-muted/60 disabled:opacity-50"
              >
                <span className="font-medium text-foreground">{preset.label}</span>
              </button>
            ))}
            </div>
          </CollapsibleSection>
          <CollapsibleSection
            title="Plantillas de slide (CN-7)"
            icon={BookOpen}
            defaultOpen={false}
            storageKey="elementos.quimica.plantillas"
            badge={CHEMISTRY_SLIDE_TEMPLATES.length + 1}
            className="mt-2.5 border-t border-border/50 pt-2"
          >
            <div className="space-y-1">
              {CHEMISTRY_SLIDE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  disabled={onCreateActivitySlide ? disabled : disabledNonText}
                  onClick={() => {
                    if (isLabSlideTemplate(tmpl)) {
                      onMergeClassVariables?.(tmpl.variablesClase);
                    }
                    if (onCreateActivitySlide) {
                      onCreateActivitySlide(
                        { bloques: tmpl.buildBlocks(), layout: tmpl.layout },
                        tmpl.titulo,
                      );
                      toast.success(`Slide «${tmpl.titulo}» creado`);
                      return;
                    }
                    void addBlocksSequential(tmpl.buildBlocks());
                  }}
                  className="w-full rounded-md border border-transparent p-1.5 text-left hover:border-border hover:bg-muted/70 disabled:opacity-50"
                >
                  <div className="text-[11px] font-medium leading-tight text-foreground">{tmpl.nombre}</div>
                  <div className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{tmpl.descripcion}</div>
                </button>
              ))}
              <button
                type="button"
                disabled={disabled || !!slideHasActivity}
                onClick={() => onAddActivity?.('balancear-ecuacion')}
                className="w-full rounded-md border border-dashed border-border p-1.5 text-left hover:bg-muted/70 disabled:opacity-50"
              >
                <div className="text-[11px] font-medium text-foreground">Slide de práctica — balanceo</div>
                <div className="text-[10px] text-muted-foreground">Crea un slide dedicado a la actividad evaluable.</div>
              </button>
            </div>
          </CollapsibleSection>
        </PanelSection>
        <PanelSection title="Multimedia" storageKey="elementos.multimedia" badge={2}>
          <InsertBtn
            label="Video (YouTube)"
            icon={Video}
            disabled={disabledNonText}
            onClick={() =>
              add({
                tipo: 'video',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                plataforma: 'youtube',
                controles: true,
              })
            }
          />
          <InsertBtn
            label="Audio"
            icon={Volume2}
            disabled={disabledNonText}
            onClick={() =>
              add({
                tipo: 'audio',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                controles: true,
              })
            }
          />
        </PanelSection>
        <PanelSection title="Estructura" storageKey="elementos.estructura" badge={4}>
          <div className="grid grid-cols-2 gap-1.5">
          <InsertBtn
            label="Separador"
            icon={Minus}
            disabled={disabledNonText}
            onClick={() => add(createDefaultSeparadorBlock())}
          />
          <InsertBtn
            label="Ecuación"
            icon={Sigma}
            disabled={disabledNonText}
            onClick={() => add(createDefaultEcuacionBlock())}
          />
          <InsertBtn
            label="Cita"
            icon={Quote}
            disabled={disabledNonText}
            onClick={() => add({ tipo: 'cita', texto: 'Texto de la cita', autor: 'Autor' })}
          />
          <InsertBtn
            label="Dos columnas (vacías)"
            icon={Columns2}
            disabled={disabledNonText}
            onClick={() =>
              add({
                tipo: 'columnas',
                columnas: [
                  [createTextBlock({ preset: 'cuerpo', omitPosition: true, extra: { contenido: 'Columna izquierda' } })],
                  [createTextBlock({ preset: 'cuerpo', omitPosition: true, extra: { contenido: 'Columna derecha' } })],
                ],
                proporcion: '1:1',
              })
            }
          />
          </div>
        </PanelSection>
      </div>
    </ScrollArea>
  );
}
