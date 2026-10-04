/**
 * Plantillas pedagógicas de química (Etapa Q5) — bloques por defecto alineados a CN-7.
 */

import type { Activity, Block, BlockMarco } from '@lumina/types/slide';

import {
  balancearEcuacionTemplate,
  formularCompuestoTemplate,
  ubicarElementoTemplate,
} from '../activities/chemistry/chemistry-activities.js';
import { createDefaultEcuacionBlock } from '../blocks/ecuacion/ecuacion-defaults.js';
import { createTextBlock } from '../blocks/texto/texto-defaults.js';
import { createDefaultTablaPeriodicaBlock } from '../widgets/tabla_periodica/tabla-periodica-defaults.js';

export interface ChemistryEquationPreset {
  id: string;
  label: string;
  latex: string;
}

export interface ChemistrySlideTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  intencionPedagogica: string;
  titulo: string;
  layout: 'titulo_y_contenido' | 'pantalla_completa';
  buildBlocks: () => Block[];
}

export const CHEMISTRY_EQUATION_PRESETS: ChemistryEquationPreset[] = [
  {
    id: 'combustion-h2',
    label: 'Combustión del hidrógeno',
    latex: '\\ce{2H2 + O2 -> 2H2O}',
  },
  {
    id: 'neutralizacion',
    label: 'Neutralización ácido-base',
    latex: '\\ce{HCl + NaOH -> NaCl + H2O}',
  },
  {
    id: 'oxido-hierro',
    label: 'Formación de óxido de hierro',
    latex: '\\ce{4Fe + 3O2 -> 2Fe2O3}',
  },
];

export function createChemistryEquationBlock(latex: string, marco?: Partial<BlockMarco>): Block {
  const fb = { x: 10, y: 30, ancho: 80, alto: 28 };
  return createDefaultEcuacionBlock({
    latex,
    tamano: 34,
    alineacion: 'centro',
    x: marco?.izquierdaPct ?? fb.x,
    y: marco?.arribaPct ?? fb.y,
    ancho: marco?.anchoPct ?? fb.ancho,
    alto: marco?.altoPct ?? fb.alto,
  });
}

export function buildExplorePeriodicTableBlocks(): Block[] {
  return [
    createTextBlock({
      preset: 'titulo',
      extra: {
        contenido: 'La tabla periódica de los elementos',
        x: 5,
        y: 4,
        ancho: 90,
        alto: 12,
      },
    }),
    createTextBlock({
      preset: 'cuerpo',
      extra: {
        contenido:
          'Explora símbolos, grupos y periodos. Relaciona la posición del elemento con sus propiedades (DBA CN-7).',
        x: 5,
        y: 16,
        ancho: 90,
        alto: 10,
      },
    }),
    createDefaultTablaPeriodicaBlock({
      izquierdaPct: 4,
      arribaPct: 28,
      anchoPct: 92,
      altoPct: 68,
    }),
  ];
}

export function buildReactionWithCeBlocks(): Block[] {
  return [
    createTextBlock({
      preset: 'titulo',
      extra: {
        contenido: 'Reacción química',
        x: 5,
        y: 5,
        ancho: 90,
        alto: 12,
      },
    }),
    createTextBlock({
      preset: 'cuerpo',
      extra: {
        contenido: 'Lee reactivos y productos en notación mhchem (\\ce{}).',
        x: 5,
        y: 18,
        ancho: 90,
        alto: 8,
      },
    }),
    createChemistryEquationBlock(CHEMISTRY_EQUATION_PRESETS[0].latex, {
      izquierdaPct: 8,
      arribaPct: 32,
      anchoPct: 84,
      altoPct: 30,
    }),
  ];
}

export const CHEMISTRY_SLIDE_TEMPLATES: ChemistrySlideTemplate[] = [
  {
    id: 'cn7-tabla-periodica',
    nombre: 'Exploración — tabla periódica',
    descripcion: 'Título, guía breve y tabla interactiva a pantalla completa.',
    intencionPedagogica: 'DBA CN-7: ubicar elementos y leer tendencias por grupo y periodo.',
    titulo: 'Tabla periódica — exploración',
    layout: 'pantalla_completa',
    buildBlocks: buildExplorePeriodicTableBlocks,
  },
  {
    id: 'cn7-reaccion-ce',
    nombre: 'Concepto — reacción con \\ce{}',
    descripcion: 'Texto introductorio y ecuación química renderizada con mhchem.',
    intencionPedagogica: 'Vincular símbolos y ecuaciones balanceadas con el lenguaje del compositor (Q2).',
    titulo: 'Reacción química — notación',
    layout: 'titulo_y_contenido',
    buildBlocks: buildReactionWithCeBlocks,
  },
];

export type ChemistryQuickActivityId = 'balancear-ecuacion' | 'ubicar-elemento' | 'formular-compuesto';

export const CHEMISTRY_QUICK_ACTIVITIES: {
  id: ChemistryQuickActivityId;
  label: string;
}[] = [
  { id: 'balancear-ecuacion', label: 'Balancear ecuación' },
  { id: 'ubicar-elemento', label: 'Ubicar en la tabla' },
  { id: 'formular-compuesto', label: 'Formular compuesto' },
];

export function chemistryActivityTemplate(
  id: ChemistryQuickActivityId,
): Activity {
  switch (id) {
    case 'balancear-ecuacion':
      return balancearEcuacionTemplate();
    case 'ubicar-elemento':
      return ubicarElementoTemplate();
    case 'formular-compuesto':
      return formularCompuestoTemplate();
    default:
      return balancearEcuacionTemplate();
  }
}

export function chemistryActivitySlideTitle(id: ChemistryQuickActivityId): string {
  const found = CHEMISTRY_QUICK_ACTIVITIES.find((a) => a.id === id);
  return found?.label ?? 'Actividad química';
}
