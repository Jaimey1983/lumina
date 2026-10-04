/**
 * Plantillas de laboratorio Q7 — variables M2, ecuación interactiva y gráfico dinámico.
 *
 * Motor K/N (docente): puedes exigir «visitar» la ecuación o «N cambios» en variables
 * antes de avanzar con reglas sobre `visitado` / contadores; no se implementa N9 aquí.
 */

import type { VariableDef } from '@lumina/types/interaction';
import type { Block } from '@lumina/types/slide';
import { dilutionSeries, idealGasSeries } from '@lumina/chemistry';

import { createDefaultEcuacionBlock } from '../blocks/ecuacion/ecuacion-defaults.js';
import { createDefaultGraficoBlock } from '../blocks/grafico/grafico-defaults.js';
import { createTextBlock } from '../blocks/texto/texto-defaults.js';
import type { ChemistrySlideTemplate } from './chemistry-slide-templates.js';

export const Q7_LAB_VAR_IDS = {
  gasN: 'v_q7_gas_n',
  gasT: 'v_q7_gas_T',
  gasV: 'v_q7_gas_V',
  dilC1: 'v_q7_dil_C1',
  dilV1: 'v_q7_dil_V1',
  dilV2: 'v_q7_dil_V2',
} as const;

export interface ChemistryLabSlideTemplate extends ChemistrySlideTemplate {
  variablesClase: VariableDef[];
  notaMotorK: string;
}

const NOTA_MOTOR_K =
  'Sugerencia docente: usa reglas del motor K para bloquear el avance hasta que el estudiante explore la ecuación (evento visitado) o cambie las variables al menos N veces.';

function buildIdealGasBlocks(): Block[] {
  const n = 1;
  const T = 298;
  const V = 4;
  const series = idealGasSeries(n, T, 1, 12, 12);
  return [
    createTextBlock({
      preset: 'titulo',
      extra: {
        contenido: 'Laboratorio — gas ideal',
        x: 5,
        y: 3,
        ancho: 90,
        alto: 10,
      },
    }),
    createTextBlock({
      preset: 'cuerpo',
      extra: {
        contenido:
          'Ajusta n, T o V con los controles de la ecuación (R ≈ 0,0821 L·atm·mol⁻¹·K⁻¹). Observa cómo cambia P y la curva P–V.',
        x: 5,
        y: 14,
        ancho: 90,
        alto: 10,
      },
    }),
    createDefaultEcuacionBlock({
      latex: 'P\\ (\\text{atm}) = \\frac{ {{n}} \\cdot 0{,}0821 \\cdot {{T}} }{ {{V}} }',
      tamano: 28,
      x: 8,
      y: 26,
      ancho: 84,
      alto: 18,
      vinculos: [
        {
          simbolo: 'n',
          variableId: Q7_LAB_VAR_IDS.gasN,
          controlable: true,
          paso: 0.5,
          min: 0.5,
          max: 3,
        },
        {
          simbolo: 'T',
          variableId: Q7_LAB_VAR_IDS.gasT,
          controlable: true,
          paso: 10,
          min: 273,
          max: 400,
        },
        {
          simbolo: 'V',
          variableId: Q7_LAB_VAR_IDS.gasV,
          controlable: true,
          paso: 0.5,
          min: 1,
          max: 12,
        },
      ],
    }),
    createDefaultGraficoBlock(
      {
        chartType: 'line',
        titulo: 'Presión frente al volumen',
        curva: 'suave',
        categorias: series.map((p) => p.V.toFixed(1)),
        series: [
          {
            nombre: 'P (atm)',
            valores: series.map((p) => Math.round(p.P * 1000) / 1000),
          },
        ],
        simulacionQuimica: {
          simulacion: 'idealGas_P_vs_V',
          variablesIds: [
            Q7_LAB_VAR_IDS.gasN,
            Q7_LAB_VAR_IDS.gasT,
            Q7_LAB_VAR_IDS.gasV,
          ],
          constantes: { vMin: 1, vMax: 12 },
        },
        x: 10,
        y: 48,
        ancho: 80,
        alto: 48,
      },
      { izquierdaPct: 10, arribaPct: 48, anchoPct: 80, altoPct: 48 },
    ),
  ];
}

function buildDilutionBlocks(): Block[] {
  const C1 = 2;
  const V1 = 0.05;
  const V2 = 0.1;
  const series = dilutionSeries(C1, V1, 0.05, 0.5, 12);
  return [
    createTextBlock({
      preset: 'titulo',
      extra: {
        contenido: 'Laboratorio — dilución',
        x: 5,
        y: 3,
        ancho: 90,
        alto: 10,
      },
    }),
    createTextBlock({
      preset: 'cuerpo',
      extra: {
        contenido:
          'C₁V₁ = C₂V₂. Cambia V₂ y observa C₂ en la ecuación y en el gráfico.',
        x: 5,
        y: 14,
        ancho: 90,
        alto: 10,
      },
    }),
    createDefaultEcuacionBlock({
      latex: 'C_2 = \\frac{ {{C1}} \\cdot {{V1}} }{ {{V2}} }',
      tamano: 30,
      x: 10,
      y: 28,
      ancho: 80,
      alto: 16,
      vinculos: [
        {
          simbolo: 'C1',
          variableId: Q7_LAB_VAR_IDS.dilC1,
          controlable: true,
          paso: 0.5,
          min: 0.5,
          max: 5,
        },
        {
          simbolo: 'V1',
          variableId: Q7_LAB_VAR_IDS.dilV1,
          controlable: true,
          paso: 0.01,
          min: 0.01,
          max: 0.2,
        },
        {
          simbolo: 'V2',
          variableId: Q7_LAB_VAR_IDS.dilV2,
          controlable: true,
          paso: 0.02,
          min: 0.05,
          max: 0.5,
        },
      ],
    }),
    createDefaultGraficoBlock(
      {
        chartType: 'line',
        titulo: 'Concentración final frente a V₂',
        curva: 'suave',
        categorias: series.map((p) => p.V2.toFixed(3)),
        series: [
          {
            nombre: 'C₂ (mol/L)',
            valores: series.map((p) => Math.round(p.C2 * 1000) / 1000),
          },
        ],
        simulacionQuimica: {
          simulacion: 'dilution_C2_vs_V2',
          variablesIds: [
            Q7_LAB_VAR_IDS.dilC1,
            Q7_LAB_VAR_IDS.dilV1,
            Q7_LAB_VAR_IDS.dilV2,
          ],
          constantes: { v2Min: 0.05, v2Max: 0.5 },
        },
        x: 10,
        y: 48,
        ancho: 80,
        alto: 48,
      },
      { izquierdaPct: 10, arribaPct: 48, anchoPct: 80, altoPct: 48 },
    ),
  ];
}

export const CHEMISTRY_LAB_SLIDE_TEMPLATES: ChemistryLabSlideTemplate[] = [
  {
    id: 'q7-lab-gas-ideal',
    nombre: 'Lab — gas ideal (P–V)',
    descripcion: 'Ecuación \\ce{PV=nRT} con variables y gráfico P–V.',
    intencionPedagogica: 'Relacionar presión y volumen a n y T constantes (CN / físico-química).',
    titulo: 'Laboratorio: gas ideal',
    layout: 'titulo_y_contenido',
    buildBlocks: buildIdealGasBlocks,
    notaMotorK: NOTA_MOTOR_K,
    variablesClase: [
      { id: Q7_LAB_VAR_IDS.gasN, nombre: 'n (mol)', tipo: 'numero', valorInicial: 1 },
      { id: Q7_LAB_VAR_IDS.gasT, nombre: 'T (K)', tipo: 'numero', valorInicial: 298 },
      { id: Q7_LAB_VAR_IDS.gasV, nombre: 'V (L)', tipo: 'numero', valorInicial: 4 },
    ],
  },
  {
    id: 'q7-lab-dilucion',
    nombre: 'Lab — dilución C₁V₁=C₂V₂',
    descripcion: 'Variables en la ecuación y curva C₂ frente a V₂.',
    intencionPedagogica: 'Comprender dilución por variación de volumen.',
    titulo: 'Laboratorio: dilución',
    layout: 'titulo_y_contenido',
    buildBlocks: buildDilutionBlocks,
    notaMotorK: NOTA_MOTOR_K,
    variablesClase: [
      { id: Q7_LAB_VAR_IDS.dilC1, nombre: 'C₁ (mol/L)', tipo: 'numero', valorInicial: 2 },
      { id: Q7_LAB_VAR_IDS.dilV1, nombre: 'V₁ (L)', tipo: 'numero', valorInicial: 0.05 },
      { id: Q7_LAB_VAR_IDS.dilV2, nombre: 'V₂ (L)', tipo: 'numero', valorInicial: 0.1 },
    ],
  },
];
