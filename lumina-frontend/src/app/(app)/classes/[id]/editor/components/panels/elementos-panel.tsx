'use client';

import { useState } from 'react';
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
import type { Block, GraficoChartType } from '@lumina/types/slide';
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
import { ImagesElementPanel, IMAGES_SECTION_TITLE } from './images-element-panel';
import {
  ClipMasksPanel,
  CLIP_MASKS_SECTION_TITLE,
  CLIP_MASK_TEXT_LABEL,
  MASK_ITEMS,
} from './clip-masks-panel';
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
import {
  PanelSection,
  InsertBtn,
  PanelSearch,
  PanelSearchEmpty,
  matchesQuery,
  type ContentPanelProps,
} from './panel-shared';

function isLabSlideTemplate(
  tmpl: (typeof CHEMISTRY_SLIDE_TEMPLATES)[number],
): tmpl is ChemistryLabSlideTemplate {
  return CHEMISTRY_LAB_SLIDE_TEMPLATES.some((l) => l.id === tmpl.id);
}

/** Títulos de sección y etiquetas que usan a la vez el render y la búsqueda. */
const SECCION = {
  graficos: 'Gráficos de Datos',
  plantillasGrafico: 'Plantillas Pedagógicas',
  diagramas: 'Diagramas',
  quimica: 'Química',
  ecuaciones: 'Ecuaciones rápidas (mhchem)',
  plantillasQuimica: 'Plantillas de slide (CN-7)',
  multimedia: 'Multimedia',
  estructura: 'Estructura',
} as const;

const QUIMICA_LABEL = {
  tabla: 'Tabla periódica',
  molecula: 'Molécula 2D',
  ecuacion: 'Ecuación \\ce{} (ejemplo)',
  practica: 'Slide de práctica — balanceo',
} as const;

/** Todo lo insertable de la sección Química (también alimenta el conteo y la búsqueda). */
const QUIMICA_ITEM_LABELS: string[] = [
  QUIMICA_LABEL.tabla,
  QUIMICA_LABEL.molecula,
  QUIMICA_LABEL.ecuacion,
  ...CHEMISTRY_QUICK_ACTIVITIES.map((a) => a.label),
  ...CHEMISTRY_EQUATION_PRESETS.map((p) => p.label),
  ...CHEMISTRY_SLIDE_TEMPLATES.map((t) => t.nombre),
  QUIMICA_LABEL.practica,
];

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

const GRAFICOS_TIPOS: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  chartType: GraficoChartType;
  titulo: string;
}> = [
  { label: 'Comparación', icon: BarChart2, chartType: 'column', titulo: 'Comparación de datos' },
  { label: 'Evolución', icon: LineChart, chartType: 'line', titulo: 'Evolución en el tiempo' },
  { label: 'Proporción', icon: CircleDot, chartType: 'donut', titulo: 'Distribución y proporción' },
  { label: 'Relación', icon: ScatterChart, chartType: 'scatter', titulo: 'Relación y dispersión' },
  { label: 'Estadística', icon: BarChartHorizontal, chartType: 'histogram', titulo: 'Distribución estadística' },
  { label: 'Progreso / KPI', icon: Gauge, chartType: 'radialBar', titulo: 'Progreso y métricas' },
  { label: 'Especiales', icon: Grid, chartType: 'heatmap', titulo: 'Matriz especial' },
];

const MULTIMEDIA: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  create: () => Block;
}> = [
  {
    label: 'Video (YouTube)',
    icon: Video,
    create: () => ({
      tipo: 'video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      plataforma: 'youtube',
      controles: true,
    }),
  },
  {
    label: 'Audio',
    icon: Volume2,
    create: () => ({
      tipo: 'audio',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      controles: true,
    }),
  },
];

const ESTRUCTURA: Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  create: () => Block;
}> = [
  { label: 'Separador', icon: Minus, create: createDefaultSeparadorBlock },
  { label: 'Ecuación', icon: Sigma, create: createDefaultEcuacionBlock },
  { label: 'Cita', icon: Quote, create: () => ({ tipo: 'cita', texto: 'Texto de la cita', autor: 'Autor' }) },
  {
    label: 'Dos columnas (vacías)',
    icon: Columns2,
    create: () => ({
      tipo: 'columnas',
      columnas: [
        [createTextBlock({ preset: 'cuerpo', omitPosition: true, extra: { contenido: 'Columna izquierda' } })],
        [createTextBlock({ preset: 'cuerpo', omitPosition: true, extra: { contenido: 'Columna derecha' } })],
      ],
      proporcion: '1:1',
    }),
  },
];

/** Qué secciones del panel «Elementos» tienen alguna coincidencia con la búsqueda. */
export function seccionesVisibles(query: string) {
  const searching = query.trim() !== '';
  const hit = (text: string) => matchesQuery(text, query);
  const has = (section: string, labels: string[]) =>
    !searching || hit(section) || labels.some(hit);
  return {
    imagenes: has(IMAGES_SECTION_TITLE, ['URL de imagen']),
    mascaras: has(CLIP_MASKS_SECTION_TITLE, [...MASK_ITEMS.map((m) => m.label), CLIP_MASK_TEXT_LABEL]),
    graficos: has(SECCION.graficos, [
      ...GRAFICOS_TIPOS.map((g) => g.label),
      ...GRAFICO_TEMPLATES.map((t) => t.nombre),
      SECCION.plantillasGrafico,
    ]),
    diagramas: has(SECCION.diagramas, DIAGRAMAS.map((d) => d.label)),
    quimica: has(SECCION.quimica, [...QUIMICA_ITEM_LABELS, SECCION.ecuaciones, SECCION.plantillasQuimica]),
    multimedia: has(SECCION.multimedia, MULTIMEDIA.map((m) => m.label)),
    estructura: has(SECCION.estructura, ESTRUCTURA.map((e) => e.label)),
  };
}

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
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const hit = (text: string) => matchesQuery(text, query);
  /** Un ítem se muestra si no se busca, si coincide la sección o si coincide el ítem. */
  const show = (section: string, label: string) => !searching || hit(section) || hit(label);

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

  const visible = seccionesVisibles(query);
  const graficoPlantillas = GRAFICO_TEMPLATES.filter(
    (t) => show(SECCION.graficos, t.nombre) || hit(SECCION.plantillasGrafico),
  );
  const presets = CHEMISTRY_EQUATION_PRESETS.filter(
    (p) => show(SECCION.quimica, p.label) || hit(SECCION.ecuaciones),
  );
  const plantillasQuimica = CHEMISTRY_SLIDE_TEMPLATES.filter(
    (t) => show(SECCION.quimica, t.nombre) || hit(SECCION.plantillasQuimica),
  );
  const mostrarPractica =
    show(SECCION.quimica, QUIMICA_LABEL.practica) || hit(SECCION.plantillasQuimica);
  const algunaVisible = Object.values(visible).some(Boolean);

  return (
    <ScrollArea className="h-full min-h-0 bg-white dark:bg-zinc-900">
      <div className="space-y-4 p-3 pr-2">
        <PanelSearch value={query} onChange={setQuery} placeholder="Buscar elementos…" label="Buscar elementos" />
        {slideHasActivity && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            Solo puedes agregar texto (título) a este slide.
          </p>
        )}
        {searching && !algunaVisible ? <PanelSearchEmpty query={query} /> : null}
        {visible.imagenes && (
          <ImagesElementPanel onInsert={insertImage} disabled={disabledNonText} forceOpen={searching} />
        )}
        {visible.mascaras && (
          <ClipMasksPanel
            apiSlide={apiSlide}
            onCommitContent={onCommitContent}
            disabled={disabledNonText}
            forceOpen={searching}
          />
        )}
        {visible.graficos && (
          <PanelSection
            title={SECCION.graficos}
            storageKey="elementos.graficos"
            badge={GRAFICOS_TIPOS.length + GRAFICO_TEMPLATES.length}
            forceOpen={searching}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {GRAFICOS_TIPOS.filter((g) => show(SECCION.graficos, g.label)).map((g) => (
                <InsertBtn
                  key={g.label}
                  label={g.label}
                  icon={g.icon}
                  disabled={disabledNonText}
                  onClick={() => add(createDefaultGraficoBlock({ chartType: g.chartType, titulo: g.titulo }))}
                />
              ))}
            </div>

            {graficoPlantillas.length > 0 && (
              <CollapsibleSection
                title={SECCION.plantillasGrafico}
                icon={BookOpen}
                defaultOpen={false}
                storageKey="elementos.graficos.plantillas"
                badge={GRAFICO_TEMPLATES.length}
                forceOpen={searching}
                className="mt-2.5 pt-2 border-t border-border/50"
              >
                <div className="space-y-1">
                  {graficoPlantillas.map((tmpl) => (
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
            )}
          </PanelSection>
        )}
        {visible.diagramas && (
          <PanelSection
            title={SECCION.diagramas}
            storageKey="elementos.diagramas"
            defaultOpen={false}
            badge={DIAGRAMAS.length}
            forceOpen={searching}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {DIAGRAMAS.filter((d) => show(SECCION.diagramas, d.label)).map((d) => (
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
        )}
        {visible.quimica && (
          <PanelSection
            title={SECCION.quimica}
            storageKey="elementos.quimica"
            defaultOpen={false}
            badge={QUIMICA_ITEM_LABELS.length}
            forceOpen={searching}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {show(SECCION.quimica, QUIMICA_LABEL.tabla) && (
                <InsertBtn
                  label={QUIMICA_LABEL.tabla}
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
              )}
              {show(SECCION.quimica, QUIMICA_LABEL.molecula) && (
                <InsertBtn
                  label={QUIMICA_LABEL.molecula}
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
              )}
              {show(SECCION.quimica, QUIMICA_LABEL.ecuacion) && (
                <InsertBtn
                  label={QUIMICA_LABEL.ecuacion}
                  icon={TestTube2}
                  disabled={disabledNonText}
                  onClick={() => add(createChemistryEquationBlock(CHEMISTRY_EQUATION_PRESETS[0].latex))}
                />
              )}
              {CHEMISTRY_QUICK_ACTIVITIES.filter((act) => show(SECCION.quimica, act.label)).map((act) => (
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
            {presets.length > 0 && (
              <CollapsibleSection
                title={SECCION.ecuaciones}
                defaultOpen={false}
                storageKey="elementos.quimica.ecuaciones"
                badge={CHEMISTRY_EQUATION_PRESETS.length}
                forceOpen={searching}
                className="mt-2"
              >
                <div className="space-y-1">
                  {presets.map((preset) => (
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
            )}
            {(plantillasQuimica.length > 0 || mostrarPractica) && (
              <CollapsibleSection
                title={SECCION.plantillasQuimica}
                icon={BookOpen}
                defaultOpen={false}
                storageKey="elementos.quimica.plantillas"
                badge={CHEMISTRY_SLIDE_TEMPLATES.length + 1}
                forceOpen={searching}
                className="mt-2.5 border-t border-border/50 pt-2"
              >
                <div className="space-y-1">
                  {plantillasQuimica.map((tmpl) => (
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
                  {mostrarPractica && (
                    <button
                      type="button"
                      disabled={disabled || !!slideHasActivity}
                      onClick={() => onAddActivity?.('balancear-ecuacion')}
                      className="w-full rounded-md border border-dashed border-border p-1.5 text-left hover:bg-muted/70 disabled:opacity-50"
                    >
                      <div className="text-[11px] font-medium text-foreground">{QUIMICA_LABEL.practica}</div>
                      <div className="text-[10px] text-muted-foreground">Crea un slide dedicado a la actividad evaluable.</div>
                    </button>
                  )}
                </div>
              </CollapsibleSection>
            )}
          </PanelSection>
        )}
        {visible.multimedia && (
          <PanelSection
            title={SECCION.multimedia}
            storageKey="elementos.multimedia"
            badge={MULTIMEDIA.length}
            forceOpen={searching}
          >
            {MULTIMEDIA.filter((m) => show(SECCION.multimedia, m.label)).map((m) => (
              <InsertBtn
                key={m.label}
                label={m.label}
                icon={m.icon}
                disabled={disabledNonText}
                onClick={() => add(m.create())}
              />
            ))}
          </PanelSection>
        )}
        {visible.estructura && (
          <PanelSection
            title={SECCION.estructura}
            storageKey="elementos.estructura"
            badge={ESTRUCTURA.length}
            forceOpen={searching}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {ESTRUCTURA.filter((e) => show(SECCION.estructura, e.label)).map((e) => (
                <InsertBtn
                  key={e.label}
                  label={e.label}
                  icon={e.icon}
                  disabled={disabledNonText}
                  onClick={() => add(e.create())}
                />
              ))}
            </div>
          </PanelSection>
        )}
      </div>
    </ScrollArea>
  );
}
