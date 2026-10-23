// Búsqueda de comandos sobre el registro (Y5): normalización y puntuación puras, sin React.

import type { DefinicionComando } from "./comandos-registro.js";
import { SINONIMOS_POR_COMANDO } from "./sinonimos-comandos.js";

export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Menor puntaje = más relevante. */
export const PUNTAJE_EXACTA = 0;
export const PUNTAJE_PREFIJO = 1;
export const PUNTAJE_CONTIENE = 2;
export const PUNTAJE_SINONIMO = 3;

const ORDEN_GRUPO_VACIO: readonly DefinicionComando["grupo"][] = [
  "historial",
  "herramientas",
  "edicion",
  "formato",
  "orden",
  "alinear",
  "distribuir",
  "vista",
  "cierre",
  "formas",
];

function puntajeCoincidencia(consulta: string, def: DefinicionComando): number | null {
  const etiqueta = normalizarBusqueda(def.etiqueta);
  if (etiqueta === consulta) return PUNTAJE_EXACTA;
  if (etiqueta.startsWith(consulta)) return PUNTAJE_PREFIJO;
  if (etiqueta.includes(consulta)) return PUNTAJE_CONTIENE;
  const sinonimos = SINONIMOS_POR_COMANDO[def.id] ?? [];
  for (const s of sinonimos) {
    const n = normalizarBusqueda(s);
    if (n === consulta || n.startsWith(consulta) || consulta.startsWith(n) || n.includes(consulta) || consulta.includes(n)) {
      return PUNTAJE_SINONIMO;
    }
  }
  return null;
}

export interface ResultadoBusquedaComando {
  comando: DefinicionComando;
  puntaje: number;
}

/** Lista ordenada para el buscador; con consulta vacía devuelve todos, agrupados y con formas al final. */
export function buscarComandos(consulta: string, comandos: readonly DefinicionComando[]): ResultadoBusquedaComando[] {
  const q = normalizarBusqueda(consulta);
  if (!q) {
    return [...comandos]
      .sort((a, b) => {
        const ga = ORDEN_GRUPO_VACIO.indexOf(a.grupo);
        const gb = ORDEN_GRUPO_VACIO.indexOf(b.grupo);
        if (ga !== gb) return ga - gb;
        return a.etiqueta.localeCompare(b.etiqueta, "es");
      })
      .map((c) => ({ comando: c, puntaje: 0 }));
  }
  const resultados: ResultadoBusquedaComando[] = [];
  for (const c of comandos) {
    const p = puntajeCoincidencia(q, c);
    if (p !== null) resultados.push({ comando: c, puntaje: p });
  }
  resultados.sort((a, b) => {
    if (a.puntaje !== b.puntaje) return a.puntaje - b.puntaje;
    return a.comando.etiqueta.localeCompare(b.comando.etiqueta, "es");
  });
  return resultados;
}
