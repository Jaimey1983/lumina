// ─── Plantillas Pedagógicas de Gráficos de Datos ─────────────────────────────

import type { GraficoChartType, GraficoDatosBlock } from '@lumina/types/slide';
import { createDefaultGraficoBlock } from './grafico-defaults.js';

export interface GraficoTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  intencionPedagogica: string;
  chartType: GraficoChartType;
  buildBlock: (coords?: { x?: number; y?: number; ancho?: number; alto?: number }) => GraficoDatosBlock;
}

export const GRAFICO_TEMPLATES: GraficoTemplate[] = [
  {
    id: 'comparativa-grupos',
    nombre: 'Comparativa de Desempeño',
    descripcion: 'Compara el promedio o resultado de varios grupos o asignaturas en distintas competencias.',
    intencionPedagogica: 'Evaluar brechas de aprendizaje entre cursos o periodos.',
    chartType: 'column',
    buildBlock: (coords) =>
      createDefaultGraficoBlock({
        ...(coords || {}),
        chartType: 'column',
        titulo: 'Desempeño Académico por Competencia',
        ejeXTitulo: 'Competencia evaluada',
        ejeYTitulo: 'Puntaje promedio (0-100)',
        categorias: ['Comp. Lectora', 'Raz. Lógico', 'C. Ciudadanas', 'Inglés', 'Ciencias'],
        series: [
          { nombre: 'Grado 10-A', valores: [74, 82, 68, 60, 78] },
          { nombre: 'Grado 10-B', valores: [69, 75, 72, 65, 84] },
        ],
      }),
  },
  {
    id: 'evolucion-temporal',
    nombre: 'Evolución Histórica / Periodos',
    descripcion: 'Muestra la tendencia y avance a lo largo de los cuatro periodos académicos.',
    intencionPedagogica: 'Analizar el progreso continuo y detectar alertas tempranas de deserción o rezago.',
    chartType: 'line',
    buildBlock: (coords) =>
      createDefaultGraficoBlock({
        ...(coords || {}),
        chartType: 'line',
        titulo: 'Progreso Longitudinal del Curso',
        ejeXTitulo: 'Periodo escolar',
        ejeYTitulo: 'Promedio general',
        curva: 'suave',
        categorias: ['Periodo 1', 'Periodo 2', 'Periodo 3', 'Periodo 4'],
        series: [
          { nombre: 'Año Anterior', valores: [3.4, 3.6, 3.5, 3.8] },
          { nombre: 'Año Actual', valores: [3.5, 3.8, 4.1, 4.3] },
        ],
      }),
  },
  {
    id: 'distribucion-calificaciones',
    nombre: 'Distribución de Calificaciones',
    descripcion: 'Desglose porcentual de estudiantes según las bandas oficiales del MEN (Bajo, Básico, Alto, Superior).',
    intencionPedagogica: 'Visualizar la proporción de aprobación y focalizar refuerzos.',
    chartType: 'donut',
    buildBlock: (coords) =>
      createDefaultGraficoBlock({
        ...(coords || {}),
        chartType: 'donut',
        titulo: 'Distribución por Nivel de Logro',
        mostrarTotal: true,
        categorias: ['Bajo (1.0 - 2.9)', 'Básico (3.0 - 3.9)', 'Alto (4.0 - 4.5)', 'Superior (4.6 - 5.0)'],
        series: [
          {
            nombre: 'Estudiantes',
            valores: [4, 12, 18, 6],
          },
        ],
      }),
  },
  {
    id: 'meta-progreso',
    nombre: 'Avance Curricular / Meta',
    descripcion: 'Medidor radial del porcentaje de objetivos y temas cumplidos en el plan de estudio.',
    intencionPedagogica: 'Monitorear el cumplimiento curricular frente a la meta anual.',
    chartType: 'radialBar',
    buildBlock: (coords) =>
      createDefaultGraficoBlock({
        ...(coords || {}),
        chartType: 'radialBar',
        titulo: 'Avance del Plan Curricular',
        angulo: 'semicirculo',
        categorias: ['Unidades Completadas'],
        series: [
          {
            nombre: 'Cumplimiento',
            valores: [78],
          },
        ],
      }),
  },
  {
    id: 'encuesta-percepcion',
    nombre: 'Encuesta de Satisfacción y Clima',
    descripcion: 'Resultados de frecuencia de respuestas en escalas Likert para evaluación de aula.',
    intencionPedagogica: 'Fomentar la retroalimentación y voz estudiantil en el aula.',
    chartType: 'bar',
    buildBlock: (coords) =>
      createDefaultGraficoBlock({
        ...(coords || {}),
        chartType: 'bar',
        titulo: 'Clima de Aula y Metodología Docente',
        ejeXTitulo: 'Criterio',
        ejeYTitulo: '% Respuestas positivas',
        categorias: [
          'Claridad de explicaciones',
          'Uso de recursos digitales',
          'Trato respetuoso',
          'Puntualidad en retroalimentación',
          'Motivación e interés',
        ],
        series: [
          {
            nombre: 'Estudiantes de acuerdo (%)',
            valores: [88, 92, 95, 76, 84],
          },
        ],
      }),
  },
  {
    id: 'correlacion-estudio-nota',
    nombre: 'Correlación Horas de Estudio vs. Nota',
    descripcion: 'Diagrama de dispersión que relaciona el tiempo de estudio semanal con la calificación obtenida.',
    intencionPedagogica: 'Demostrar a los estudiantes la correlación entre hábitos de dedicación y rendimiento.',
    chartType: 'scatter',
    buildBlock: (coords) =>
      createDefaultGraficoBlock({
        ...(coords || {}),
        chartType: 'scatter',
        titulo: 'Horas de Estudio vs. Calificación Final',
        ejeXTitulo: 'Horas semanales de estudio autónomo',
        ejeYTitulo: 'Nota final (0-5.0)',
        categorias: ['Estudiantes'],
        series: [
          {
            nombre: 'Muestra de Estudiantes',
            valores: [],
            puntos: [
              { x: 2, y: 2.8 },
              { x: 3, y: 3.2 },
              { x: 4, y: 3.5 },
              { x: 5, y: 3.8 },
              { x: 6, y: 4.1 },
              { x: 7, y: 4.3 },
              { x: 8, y: 4.7 },
              { x: 9, y: 4.8 },
              { x: 10, y: 4.9 },
            ],
          },
        ],
      }),
  },
];
