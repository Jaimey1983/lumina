// ─── Panel de propiedades del editor (W8) ─────────────────────────────────────
// Lógica pura (sin React ni DOM) de lo que el panel lee de la selección y de cómo aplica un cambio.
// Un valor que difiere entre los elementos elegidos es «mixto»: el panel lo muestra como tal y no
// lo toca hasta que el docente elige uno.

import {
  FORMAS,
  actualizar,
  fijarParametro,
  resolverParametros,
  bloquear,
  cajaDeSeleccion,
  cambiarEstilo,
  mover,
  ocultar,
  redimensionar,
  reordenar,
  rotarA,
  type Contorno,
  type Elemento,
  type Escena,
  type EstiloTexto,
  type Forma,
  type Linea,
  type ModoOrden,
  type Relleno,
  type Sombra,
  type Texto,
} from "@lumina/drawing";
import { bloqueadosEfectivos } from "./asas.js";

export type Valor<T> = { mixto: false; valor: T } | { mixto: true };
export type Hoja = Forma | Texto | Linea;

const esHoja = (e: Elemento): e is Hoja => e.tipo !== "grupo";

/** Elementos con geometría de la selección (los grupos aportan sus hijos), sin repetir y en orden de apilado. */
export function hojasDeSeleccion(escena: Escena, seleccion: readonly string[]): Hoja[] {
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const incluidos = new Set<string>();
  const sumar = (id: string): void => {
    if (incluidos.has(id)) return;
    incluidos.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(sumar);
  };
  seleccion.forEach(sumar);
  return escena.elementos.filter((e): e is Hoja => esHoja(e) && incluidos.has(e.id));
}

/** Lo que se puede cambiar: las hojas de la selección que no están bloqueadas. */
export function hojasEditables(escena: Escena, seleccion: readonly string[]): Hoja[] {
  const bloqueados = bloqueadosEfectivos(escena);
  return hojasDeSeleccion(escena, seleccion).filter((h) => !bloqueados.has(h.id));
}

/** Lo que se puede cambiar con la mini barra y la pestaña «Formato de forma» (Y18): las hojas editables, si al menos una no es un conector (tienen su propia pestaña). */
export function hojasDeFormato(escena: Escena, seleccion: readonly string[]): Hoja[] {
  const editables = hojasEditables(escena, seleccion);
  return editables.some((h) => h.tipo !== "linea") ? editables : [];
}

/** ¿Hay algo a lo que darle formato? Decide si salen la barra y la pestaña «Formato de forma». */
export const hayFormato = (escena: Escena, seleccion: readonly string[]): boolean => hojasDeFormato(escena, seleccion).length > 0;

/** El valor común de `leer` en todos los elementos, o «mixto» si difiere; `null` si no hay elementos. */
export function valorComun<T>(elementos: readonly Hoja[], leer: (h: Hoja) => T): Valor<T> | null {
  const primero = elementos[0];
  if (!primero) return null;
  const v = leer(primero);
  const clave = JSON.stringify(v);
  return elementos.every((h) => JSON.stringify(leer(h)) === clave) ? { mixto: false, valor: v } : { mixto: true };
}

// ─── Qué le corresponde a cada elemento ───────────────────────────────────────

export const conRelleno = (h: Hoja): h is Forma | Texto => h.tipo !== "linea";
export const conSombra = (h: Hoja): h is Forma | Texto => h.tipo !== "linea";
/** El radio de esquinas solo lo usa el rectángulo, el cuadro de texto y el conector en ángulo recto. */
export const conRadio = (h: Hoja): boolean => (h.tipo === "forma" ? h.forma === "rectangulo" : h.tipo === "texto" ? true : h.trazado === "ortogonal");

export const ids = (hojas: readonly Hoja[]): string[] => hojas.map((h) => h.id);

// ─── Aplicar ──────────────────────────────────────────────────────────────────

type Cambio<T> = T | ((actual: T) => T);
const esFuncion = <T>(c: Cambio<T>): c is (actual: T) => T => typeof c === "function";

/** Relleno nuevo, o una función que lo calcula desde el que tiene cada elemento (para cambiar solo un color o el ángulo). */
export function fijarRelleno(escena: Escena, destino: readonly Hoja[], relleno: Cambio<Relleno>): Escena {
  const candidatos = destino.filter(conRelleno);
  if (!esFuncion(relleno)) return cambiarEstilo(escena, ids(candidatos), { estilo: { relleno } });
  return candidatos.reduce((e, h) => cambiarEstilo(e, [h.id], { estilo: { relleno: relleno(h.estilo.relleno) } }), escena);
}

export const fijarContorno = (escena: Escena, destino: readonly Hoja[], parche: Partial<Contorno>): Escena => cambiarEstilo(escena, ids(destino), { estilo: { contorno: parche } });

export const fijarOpacidad = (escena: Escena, destino: readonly Hoja[], opacidad: number): Escena => cambiarEstilo(escena, ids(destino), { estilo: { opacidad } });

/** Sombra nueva (o `null` para quitarla), o una función que la calcula desde la que tiene cada elemento. */
export function fijarSombra(escena: Escena, destino: readonly Hoja[], sombra: Cambio<Sombra | null>): Escena {
  const candidatos = destino.filter(conSombra);
  if (!esFuncion(sombra)) return cambiarEstilo(escena, ids(candidatos), { estilo: { sombra } });
  return candidatos.reduce((e, h) => cambiarEstilo(e, [h.id], { estilo: { sombra: sombra(h.estilo.sombra) } }), escena);
}

export const fijarRadio = (escena: Escena, destino: readonly Hoja[], radio: number): Escena => cambiarEstilo(escena, ids(destino.filter(conRadio)), { estilo: { radio } });

export const fijarTexto = (escena: Escena, destino: readonly Hoja[], parche: Partial<EstiloTexto>): Escena => cambiarEstilo(escena, ids(destino), { estiloTexto: parche });

export type FormatoDeTexto = "negrita" | "cursiva" | "subrayado";

/** Negrita, cursiva o subrayado como interruptor: si todo lo elegido ya lo tiene, lo quita; si no (o si es mixto), lo pone en todo. */
export function alternarTexto(escena: Escena, seleccion: readonly string[], propiedad: FormatoDeTexto): Escena {
  const destino = hojasDeFormato(escena, seleccion);
  const actual = valorComun(destino, (h) => h.estiloTexto[propiedad]);
  if (actual === null) return escena;
  return fijarTexto(escena, destino, { [propiedad]: actual.mixto || !actual.valor });
}

/** Un campo de la sección «Forma» del panel: un parámetro de la forma elegida (Y20). */
export interface CampoDeForma {
  clave: string;
  etiqueta: string;
  min: number;
  max: number;
  paso: number;
  valor: Valor<number>;
}

/**
 * Los parámetros que se pueden ajustar con la selección: las formas editables elegidas deben ser **todas del mismo tipo** y ese tipo
 * tener parámetros (si no, `[]`). El valor es «mixto» si difiere. Las asas amarillas del lienzo y estos campos llaman a la misma
 * `fijarParametro`.
 */
export function camposDeForma(escena: Escena, seleccion: readonly string[]): CampoDeForma[] {
  const formas = hojasEditables(escena, seleccion).filter((h): h is Forma => h.tipo === "forma");
  const tipo = formas[0]?.forma;
  if (!tipo || formas.some((f) => f.forma !== tipo)) return [];
  return FORMAS[tipo].parametros.map((p) => ({
    clave: p.clave,
    etiqueta: p.etiqueta,
    min: p.min,
    max: p.max,
    paso: p.paso,
    valor: valorComun(formas, (h) => resolverParametros(tipo, (h as Forma).parametros)[p.clave] ?? p.porDefecto) as Valor<number>,
  }));
}

/** Pone el parámetro `clave` en todas las formas editables elegidas. */
export const fijarParametroDeForma = (escena: Escena, destino: readonly Hoja[], clave: string, valor: number): Escena => fijarParametro(escena, ids(destino), clave, valor);

/** Relleno al cambiar de tipo: conserva el color que ya había si lo hay. */
export function rellenoDeTipo(tipo: Relleno["tipo"], actual: Relleno | null): Relleno {
  if (tipo === "ninguno") return { tipo: "ninguno" };
  const base = actual?.tipo === "solido" ? actual.color : actual?.tipo === "degradado" ? actual.desde : "#FFFFFF";
  if (tipo === "solido") return { tipo: "solido", color: base };
  return { tipo: "degradado", desde: base, hasta: actual?.tipo === "degradado" ? actual.hasta : "#2563EB", angulo: actual?.tipo === "degradado" ? actual.angulo : 90 };
}

export const SOMBRA_POR_DEFECTO: Sombra = { color: "#00000055", desenfoque: 8, dx: 2, dy: 4 };

// ─── Posición, tamaño y giro ──────────────────────────────────────────────────

export type CampoGeometria = "x" | "y" | "ancho" | "alto" | "rotacion";

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** Una sola forma o cuadro de texto: sus números exactos (caja sin girar); en otro caso, la caja que envuelve la selección. */
export function unicoConCaja(escena: Escena, seleccion: readonly string[]): Forma | Texto | null {
  if (seleccion.length !== 1) return null;
  const e = escena.elementos.find((x) => x.id === seleccion[0]);
  return e && (e.tipo === "forma" || e.tipo === "texto") ? e : null;
}

export interface Geometria {
  x: Valor<number>;
  y: Valor<number>;
  ancho: Valor<number>;
  alto: Valor<number>;
  /** Solo una forma o cuadro de texto se gira desde aquí. */
  rotacion: number | null;
}

export function leerGeometria(escena: Escena, seleccion: readonly string[]): Geometria | null {
  const unico = unicoConCaja(escena, seleccion);
  if (unico) {
    const t = unico.transformacion;
    const num = (valor: number): Valor<number> => ({ mixto: false, valor: r2(valor) });
    return { x: num(t.x), y: num(t.y), ancho: num(t.ancho), alto: num(t.alto), rotacion: r2(t.rotacion) };
  }
  const caja = cajaDeSeleccion(
    escena,
    hojasDeSeleccion(escena, seleccion).map((h) => h.id),
  );
  if (!caja) return null;
  const num = (valor: number): Valor<number> => ({ mixto: false, valor: r2(valor) });
  return { x: num(caja.x), y: num(caja.y), ancho: num(caja.ancho), alto: num(caja.alto), rotacion: null };
}

/**
 * Pone `campo` en `valor`. Una forma o cuadro de texto sola cambia sus números tal cual; varios
 * elementos (o grupos y líneas) se mueven o se escalan por la caja que los envuelve.
 */
export function fijarGeometria(escena: Escena, seleccion: readonly string[], campo: CampoGeometria, valor: number): Escena {
  if (!Number.isFinite(valor)) return escena;
  const unico = unicoConCaja(escena, seleccion);
  if (unico) {
    if (bloqueadosEfectivos(escena).has(unico.id)) return escena;
    if (campo === "rotacion") return rotarA(escena, unico.id, valor);
    const t = unico.transformacion;
    const siguiente = { ...t, [campo]: campo === "ancho" || campo === "alto" ? Math.max(1, valor) : valor };
    return actualizar(escena, [unico.id], { transformacion: siguiente });
  }
  if (campo === "rotacion") return escena;
  const objetivo = ids(hojasEditables(escena, seleccion));
  const caja = cajaDeSeleccion(escena, objetivo);
  if (!caja || objetivo.length === 0) return escena;
  if (campo === "x") return mover(escena, objetivo, valor - caja.x, 0);
  if (campo === "y") return mover(escena, objetivo, 0, valor - caja.y);
  if (campo === "ancho") return caja.ancho > 0 ? redimensionar(escena, objetivo, "se", valor - caja.ancho, 0) : escena;
  return caja.alto > 0 ? redimensionar(escena, objetivo, "se", 0, valor - caja.alto) : escena;
}

// ─── Capas ────────────────────────────────────────────────────────────────────

export interface Capa {
  id: string;
  nombre: string;
  tipo: Elemento["tipo"];
  /** 0 = de primer nivel; 1 = hijo de un grupo… */
  nivel: number;
  oculto: boolean;
  bloqueado: boolean;
  /** Puede subir o bajar (solo los de primer nivel: un hijo se mueve con su grupo). */
  puedeSubir: boolean;
  puedeBajar: boolean;
}

/** Nombre que se muestra: el que le puso el docente o uno que lo describe. */
export function nombreDeCapa(e: Elemento): string {
  if (e.nombre) return e.nombre;
  if (e.tipo === "forma") return `${FORMAS[e.forma].nombre}${e.texto ? ` «${e.texto.split("\n")[0]}»` : ""}`;
  if (e.tipo === "linea") return `${e.origen || e.destino ? "Conector" : e.fin !== "ninguno" || e.inicio !== "ninguno" ? "Flecha" : "Línea"}${e.texto ? ` «${e.texto.split("\n")[0]}»` : ""}`;
  if (e.tipo === "texto") return `Texto «${e.texto.split("\n")[0]}»`;
  return "Grupo";
}

/** Lista de capas de arriba hacia abajo (lo que está al frente primero); los hijos de un grupo, debajo de su grupo. */
export function capasDe(escena: Escena): Capa[] {
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const bloqueados = bloqueadosEfectivos(escena);
  const ocultos = new Set<string>();
  const marcarOculto = (id: string): void => {
    if (ocultos.has(id)) return;
    ocultos.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(marcarOculto);
  };
  escena.elementos.filter((e) => e.oculto).forEach((e) => marcarOculto(e.id));

  // El apilado real: cada elemento de primer nivel (con su grupo) va donde aparece su primer miembro en la escena.
  const padreDe = new Map<string, string>();
  for (const e of escena.elementos) if (e.tipo === "grupo") for (const h of e.hijos) padreDe.set(h, e.id);
  const raizDe = (id: string): string => {
    let actual = id;
    for (let i = 0; i < escena.elementos.length && padreDe.has(actual); i++) actual = padreDe.get(actual) as string;
    return actual;
  };
  const vistas = new Set<string>();
  const raices: Elemento[] = [];
  for (const e of escena.elementos) {
    const r = raizDe(e.id);
    const raiz = porId.get(r);
    if (raiz && !vistas.has(r)) {
      vistas.add(r);
      raices.push(raiz);
    }
  }
  const salida: Capa[] = [];
  const visitados = new Set<string>();
  const agregar = (e: Elemento, nivel: number, hermanos: readonly Elemento[]): void => {
    if (visitados.has(e.id)) return;
    visitados.add(e.id);
    const i = hermanos.findIndex((h) => h.id === e.id);
    salida.push({
      id: e.id,
      nombre: nombreDeCapa(e),
      tipo: e.tipo,
      nivel,
      oculto: ocultos.has(e.id),
      bloqueado: bloqueados.has(e.id),
      puedeSubir: nivel === 0 && i < hermanos.length - 1,
      puedeBajar: nivel === 0 && i > 0,
    });
    if (e.tipo === "grupo") {
      const hijosDe = e.hijos.map((h) => porId.get(h)).filter((h): h is Elemento => h !== undefined);
      [...hijosDe].reverse().forEach((h) => agregar(h, nivel + 1, hijosDe));
    }
  };
  [...raices].reverse().forEach((e) => agregar(e, 0, raices));
  return salida;
}

export const ordenarCapa = (escena: Escena, id: string, modo: ModoOrden): Escena => reordenar(escena, [id], modo);
export const ocultarCapa = (escena: Escena, id: string, valor: boolean): Escena => ocultar(escena, [id], valor);
export const bloquearCapa = (escena: Escena, id: string, valor: boolean): Escena => bloquear(escena, [id], valor);
/** Un nombre en blanco quita el nombre propio (vuelve el descriptivo). */
export const renombrarCapa = (escena: Escena, id: string, nombre: string): Escena => actualizar(escena, [id], { nombre: nombre.trim() });

// ─── Descripción para lectores de pantalla (W9) ───────────────────────────────

/** El único elemento con geometría que hay elegido (ni varios, ni un grupo): es al que se le escribe su descripción. */
export function elementoUnico(escena: Escena, seleccion: readonly string[]): Hoja | null {
  if (seleccion.length !== 1) return null;
  const e = escena.elementos.find((x) => x.id === seleccion[0]);
  return e && esHoja(e) ? e : null;
}

/** Un texto en blanco quita la descripción. Se puede escribir también en un elemento bloqueado (es solo una etiqueta). */
export const fijarDescripcion = (escena: Escena, id: string, texto: string): Escena => actualizar(escena, [id], { descripcion: texto.trim() });
