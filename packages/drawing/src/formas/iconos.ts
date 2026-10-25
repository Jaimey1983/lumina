// ─── Iconos del catálogo (Y32a, DY86–DY91) ────────────────────────────────────
// Treinta símbolos como formas con id propio. Se dibujan como contorno (sin relleno al insertarlos), escalan su trazado al tamaño de la
// caja y no tienen parámetros ni asas de ajuste. El texto, si se escribe, va centrado sobre el icono (no hay zona propia).

import type { Punto, TipoIcono } from '../tipos.js';
import type { DefinicionForma } from './catalogo.js';
import { ICONOS_DATOS } from './iconos-datos.js';
import { escalarTrazado } from './trazado-escalado.js';

/** Lado de la cuadrícula en la que están dibujados los trazados. */
const CUADRICULA = 24;
const TAMANO = 64;

export interface GrupoDeIconos {
  id: string;
  nombre: string;
  iconos: readonly TipoIcono[];
}

/** Los iconos agrupados como los muestra la galería, en orden (Y32b). */
export const GRUPOS_ICONO: readonly GrupoDeIconos[] = [
  { id: 'personas', nombre: 'Personas y escuela', iconos: ['icono-persona', 'icono-grupo', 'icono-birrete', 'icono-libro', 'icono-documento'] },
  { id: 'ciencia', nombre: 'Ciencia e ideas', iconos: ['icono-matraz', 'icono-atomo', 'icono-microscopio', 'icono-bombilla', 'icono-cerebro', 'icono-lupa'] },
  { id: 'estados', nombre: 'Estados y avisos', iconos: ['icono-check', 'icono-error', 'icono-alerta', 'icono-pregunta', 'icono-info', 'icono-objetivo'] },
  { id: 'cosas', nombre: 'Cosas', iconos: ['icono-engranaje', 'icono-reloj', 'icono-calendario', 'icono-candado', 'icono-ordenador'] },
  { id: 'mundo', nombre: 'Mundo y naturaleza', iconos: ['icono-casa', 'icono-mundo', 'icono-sol', 'icono-luna', 'icono-gota', 'icono-hoja', 'icono-corazon', 'icono-cohete'] },
];

const NOMBRES: Readonly<Record<TipoIcono, string>> = {
  'icono-persona': 'Persona',
  'icono-grupo': 'Grupo de personas',
  'icono-birrete': 'Birrete',
  'icono-libro': 'Libro',
  'icono-documento': 'Documento',
  'icono-matraz': 'Matraz',
  'icono-atomo': 'Átomo',
  'icono-microscopio': 'Microscopio',
  'icono-bombilla': 'Bombilla',
  'icono-cerebro': 'Cerebro',
  'icono-lupa': 'Lupa',
  'icono-check': 'Correcto',
  'icono-error': 'Error',
  'icono-alerta': 'Alerta',
  'icono-pregunta': 'Pregunta',
  'icono-info': 'Información',
  'icono-objetivo': 'Objetivo',
  'icono-engranaje': 'Engranaje',
  'icono-reloj': 'Reloj',
  'icono-calendario': 'Calendario',
  'icono-candado': 'Candado',
  'icono-ordenador': 'Ordenador',
  'icono-casa': 'Casa',
  'icono-mundo': 'Mundo',
  'icono-sol': 'Sol',
  'icono-luna': 'Luna',
  'icono-gota': 'Gota',
  'icono-hoja': 'Hoja',
  'icono-corazon': 'Corazón',
  'icono-cohete': 'Cohete',
};

const puertosDeLaCaja = (ancho: number, alto: number): Punto[] => [
  { x: ancho / 2, y: 0 },
  { x: ancho, y: alto / 2 },
  { x: ancho / 2, y: alto },
  { x: 0, y: alto / 2 },
];

function definirIcono(id: TipoIcono): DefinicionForma {
  const d = ICONOS_DATOS[id] ?? '';
  return {
    id,
    nombre: NOMBRES[id],
    grupo: 'iconos',
    tamano: { ancho: TAMANO, alto: TAMANO },
    parametros: [],
    trazado: (ancho, alto) => escalarTrazado(d, ancho / CUADRICULA, alto / CUADRICULA),
    rectanguloTexto: (ancho, alto) => ({ x: 0, y: 0, ancho, alto }),
    puertos: puertosDeLaCaja,
    // Un icono nace como contorno: sin relleno (lo que dibuja la librería de origen). Solo la inserción lo usa.
    estiloInicial: { relleno: { tipo: 'ninguno' } },
  };
}

const TODOS = GRUPOS_ICONO.flatMap((g) => g.iconos);

export const ICONOS = Object.fromEntries(TODOS.map((id) => [id, definirIcono(id)])) as Record<TipoIcono, DefinicionForma>;
