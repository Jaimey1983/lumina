// ─── Textos para lectores de pantalla (Y35) ───────────────────────────────────
// Puro: sin React ni DOM. Dice dónde se está y qué hay, sin tocar `describirElemento` / `describirSeleccion` (DY104).

import { cajaDeElemento, resumenDeColapso, type Elemento, type Escena } from "@lumina/drawing";

/** Cómo se nombra un elemento en el resto del editor (`describirElemento`): se recibe para no depender del componente. */
export type NombreDeElemento = (e: Elemento) => string;

/** Cuántas conexiones se dicen en el resumen antes de «y N más». */
export const MAX_CONEXIONES_DICHAS = 8;

const r = (n: number): number => (Number.isFinite(n) ? Math.round(n) : 0);
const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

const lista = (nombres: readonly string[]): string => (nombres.length <= 1 ? (nombres[0] ?? "") : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`);

/** «Rectángulo «a», en X 101, Y 100.» (uno) o «3 elementos movidos 10 a la derecha.» (varios). */
export function anuncioDeMovimiento(escena: Escena, seleccion: readonly string[], nombre: NombreDeElemento, dx: number, dy: number): string {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  const uno = elegidos.length === 1 ? elegidos[0] : undefined;
  if (uno) {
    const caja = cajaDeElemento(escena, uno);
    return `${nombre(uno)}, en X ${r(caja?.x ?? 0)}, Y ${r(caja?.y ?? 0)}.`;
  }
  const paso = r(Math.abs(dx || dy));
  const lado = dx > 0 ? "a la derecha" : dx < 0 ? "a la izquierda" : dy > 0 ? "hacia abajo" : "hacia arriba";
  return `${plural(elegidos.length, "elemento movido", "elementos movidos")} ${paso} ${lado}.`;
}

/** «Rectángulo «a», 110 por 60.» (uno) o «3 elementos, 400 por 120.» (varios, la caja que los abarca). */
export function anuncioDeTamano(escena: Escena, seleccion: readonly string[], nombre: NombreDeElemento): string {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  const uno = elegidos.length === 1 ? elegidos[0] : undefined;
  if (uno) {
    const caja = cajaDeElemento(escena, uno);
    const t = uno.tipo === "forma" || uno.tipo === "texto" ? uno.transformacion : null;
    return `${nombre(uno)}, ${r(t?.ancho ?? caja?.ancho ?? 0)} por ${r(t?.alto ?? caja?.alto ?? 0)}.`;
  }
  const cajas = elegidos.flatMap((e) => cajaDeElemento(escena, e) ?? []);
  const x0 = Math.min(...cajas.map((c) => c.x));
  const y0 = Math.min(...cajas.map((c) => c.y));
  const x1 = Math.max(...cajas.map((c) => c.x + c.ancho));
  const y1 = Math.max(...cajas.map((c) => c.y + c.alto));
  return cajas.length === 0 ? "Nada cambió de tamaño." : `${plural(elegidos.length, "elemento", "elementos")}, ${r(x1 - x0)} por ${r(y1 - y0)}.`;
}

/** «Rectángulo «a», girado a 15°.» (uno) o «3 elementos girados 15°.» (varios). */
export function anuncioDeGiro(escena: Escena, seleccion: readonly string[], nombre: NombreDeElemento, grados: number): string {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  const uno = elegidos.length === 1 ? elegidos[0] : undefined;
  if (uno && (uno.tipo === "forma" || uno.tipo === "texto")) return `${nombre(uno)}, girado a ${r(uno.transformacion.rotacion)}°.`;
  return `${plural(elegidos.length, "elemento girado", "elementos girados")} ${r(Math.abs(grados))}° ${grados >= 0 ? "a la derecha" : "a la izquierda"}.`;
}

/** «Rectángulo «a», seleccionado, 2 de 5.» — `indice` empieza en 0. */
export function anuncioDeRecorrido(descripcion: string, indice: number, total: number): string {
  return `${descripcion}, seleccionado, ${indice + 1} de ${total}.`;
}

/** Para cada forma, los nombres de lo que une un conector que sale de ella (de ella hacia el destino), en un solo recorrido. */
export function destinosPorOrigen(escena: Escena, nombre: NombreDeElemento): Map<string, string[]> {
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const salida = new Map<string, string[]>();
  for (const e of escena.elementos) {
    if (e.tipo !== "linea" || !e.origen || !e.destino) continue;
    const d = porId.get(e.destino.elementoId);
    if (d) salida.set(e.origen.elementoId, [...(salida.get(e.origen.elementoId) ?? []), nombre(d)]);
  }
  return salida;
}

/** Los nombres de lo que une un conector que sale de la forma `id` (de ella hacia el destino). */
export const conexionesDe = (escena: Escena, id: string, nombre: NombreDeElemento): string[] => destinosPorOrigen(escena, nombre).get(id) ?? [];

/**
 * El dibujo entero en pocas frases: la página, cuántas cosas hay, lo oculto y lo plegado y qué se conecta con qué.
 * Es lo que dice «Describir el dibujo» (DY103): corto, estable y sin repetir el texto de cada elemento.
 */
export function describirDibujo(escena: Escena, nombre: NombreDeElemento): string {
  if (escena.elementos.length === 0) return "El dibujo está vacío.";
  const formas = escena.elementos.filter((e) => e.tipo === "forma").length;
  const conectores = escena.elementos.filter((e) => e.tipo === "linea").length;
  const textos = escena.elementos.filter((e) => e.tipo === "texto").length;
  const grupos = escena.elementos.filter((e) => e.tipo === "grupo").length;
  const ocultos = escena.elementos.filter((e) => e.oculto === true).length;
  const { cuentas } = resumenDeColapso(escena);
  const plegadas = [...cuentas.values()].filter((n) => n > 0).length;
  const partes = [
    plural(formas, "forma", "formas"),
    plural(conectores, "conector", "conectores"),
    ...(textos > 0 ? [plural(textos, "texto", "textos")] : []),
    ...(grupos > 0 ? [plural(grupos, "grupo", "grupos")] : []),
  ];
  const frases = [`Dibujo de ${r(escena.ancho)} por ${r(escena.alto)}: ${lista(partes)}.`];
  if (ocultos > 0) frases.push(`${plural(ocultos, "elemento oculto", "elementos ocultos")}.`);
  if (plegadas > 0) frases.push(`${plural(plegadas, "rama plegada", "ramas plegadas")}.`);
  const conexiones: string[] = [];
  const destinosDe = destinosPorOrigen(escena, nombre);
  for (const e of escena.elementos) {
    if (e.tipo !== "forma") continue;
    const destinos = destinosDe.get(e.id) ?? [];
    if (destinos.length > 0) conexiones.push(`${nombre(e)} conecta con ${lista(destinos)}.`);
  }
  frases.push(...conexiones.slice(0, MAX_CONEXIONES_DICHAS));
  if (conexiones.length > MAX_CONEXIONES_DICHAS) frases.push(`Y ${plural(conexiones.length - MAX_CONEXIONES_DICHAS, "forma más", "formas más")} con conexiones.`);
  return frases.join(" ");
}
