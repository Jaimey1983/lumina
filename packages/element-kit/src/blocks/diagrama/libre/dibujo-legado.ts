// ─── Dibujos guardados con el tipo transitorio `dibujo` (W3–W9) → diagrama (W10) ───────────────
// El widget `dibujo` se retiró (DW11: el dibujo libre vive dentro de Diagramas). Si una clase aún guarda uno,
// se abre como un diagrama cuya escena es la del dibujo: mismo lugar en el slide, mismo título y descripción.
// Función pura. El bloque guardado no se toca hasta que el docente guarda algún cambio.

import { LIMITES, normalizarEscena } from '@lumina/drawing';
import type { DiagramaGrafoBlock } from '@lumina/types/slide';
import { normalizeDiagramaBlock } from '../diagrama-defaults.js';

/** Dónde se colocaba un dibujo nuevo en el slide (% del lienzo), por si el bloque guardado no traía marco. */
const MARCO_POR_DEFECTO = { x: 8, y: 12, ancho: 84, alto: 70 } as const;
const TITULO_MAX = 200;

const registro = (v: unknown): Record<string, unknown> => (v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const numero = (v: unknown, defecto: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : defecto);
const texto = (v: unknown, max: number): string | undefined => {
  const t = typeof v === 'string' ? v.trim().slice(0, max) : '';
  return t === '' ? undefined : t;
};

/** `true` si el bloque guardado es del tipo `dibujo` que ya no existe. */
export function esDibujoLegado(bloque: unknown): boolean {
  return registro(bloque).tipo === 'dibujo';
}

export function dibujoLegadoADiagrama(bruto: unknown): DiagramaGrafoBlock {
  const b = registro(bruto);
  const titulo = texto(b.titulo, TITULO_MAX);
  const descripcion = texto(b.descripcionAccesible, LIMITES.descripcion);
  const id = typeof b.id === 'string' && b.id !== '' ? b.id : `diagrama-${Date.now().toString(36)}`;
  const base: DiagramaGrafoBlock = {
    id,
    tipo: 'diagrama',
    subtipo: 'flujo',
    modo: 'contenido',
    soloLecturaEnViewer: true,
    x: numero(b.x, MARCO_POR_DEFECTO.x),
    y: numero(b.y, MARCO_POR_DEFECTO.y),
    ancho: numero(b.ancho, MARCO_POR_DEFECTO.ancho),
    alto: numero(b.alto, MARCO_POR_DEFECTO.alto),
    ...(typeof b.zIndex === 'number' && Number.isFinite(b.zIndex) ? { zIndex: b.zIndex } : {}),
    ...(titulo ? { titulo } : {}),
    ...(descripcion ? { descripcionAccesible: descripcion } : {}),
    nodos: [],
    aristas: [],
    escena: normalizarEscena(b.escena) as unknown as Record<string, unknown>,
  };
  return normalizeDiagramaBlock(base) as DiagramaGrafoBlock;
}
