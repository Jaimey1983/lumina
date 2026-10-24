// ─── Panel de propiedades del editor (W8) ─────────────────────────────────────
// Lógica pura (sin React ni DOM) de lo que el panel lee de la selección y de cómo aplica un cambio.
// Un valor que difiere entre los elementos elegidos es «mixto»: el panel lo muestra como tal y no
// lo toca hasta que el docente elige uno.

import {
  FORMAS,
  LIMITES,
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
  type ParadaDegradado,
  type PatronRelleno,
  type Relleno,
  type Sombra,
  type Texto,
  type Vinetas,
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

/** La lista del texto (viñetas o números) la llevan las formas y los cuadros de texto; el rótulo de un conector no (Y24a). */
export const conLista = (h: Hoja): h is Forma | Texto => h.tipo !== "linea";

/** La lista de lo elegido: `null` si ninguno la tiene, «mixto» si difiere; `null` también si no hay nada con lista. */
export function listaDeSeleccion(escena: Escena, seleccion: readonly string[]): Valor<Vinetas | null> | null {
  return valorComun(hojasDeFormato(escena, seleccion).filter(conLista), (h) => h.estiloTexto.vinetas ?? null);
}

/** Pone la lista `modo` (o la quita con `null`) en las formas y textos editables elegidos. Quitarla no deja el campo en la escena. */
export function fijarVinetas(escena: Escena, seleccion: readonly string[], modo: Vinetas | null): Escena {
  const destino = hojasDeFormato(escena, seleccion).filter(conLista);
  if (destino.every((h) => (h.estiloTexto.vinetas ?? null) === modo)) return escena;
  return fijarTexto(escena, destino, { vinetas: modo ?? undefined });
}

/** Interruptor: si todo lo elegido ya tiene la lista `modo`, la quita; si no (o si es mixto), la pone en todo. */
export function alternarVinetas(escena: Escena, seleccion: readonly string[], modo: Vinetas): Escena {
  const actual = listaDeSeleccion(escena, seleccion);
  if (actual === null) return escena;
  return fijarVinetas(escena, seleccion, !actual.mixto && actual.valor === modo ? null : modo);
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

export type RellenoDegradado = Extract<Relleno, { tipo: "degradado" }>;
export type RellenoPatron = Extract<Relleno, { tipo: "patron" }>;

/** Color de las líneas de un patrón nuevo cuando el relleno de partida no da uno que se vea sobre un fondo claro. */
const COLOR_LINEAS_POR_DEFECTO = "#334155";

/** Relleno al cambiar de tipo: conserva el color que ya había si lo hay. */
export function rellenoDeTipo(tipo: Relleno["tipo"], actual: Relleno | null): Relleno {
  if (tipo === "ninguno") return { tipo: "ninguno" };
  const base = actual?.tipo === "solido" ? actual.color : actual?.tipo === "degradado" ? actual.desde : actual?.tipo === "patron" ? actual.color : "#FFFFFF";
  if (tipo === "solido") return { tipo: "solido", color: base };
  if (tipo === "patron") {
    // Blanco (o nada) no se vería: las líneas toman el gris de siempre.
    const lineas = base.toUpperCase() === "#FFFFFF" || base.toUpperCase() === "#FFF" ? COLOR_LINEAS_POR_DEFECTO : base;
    return { tipo: "patron", patron: "diagonal", color: lineas, fondo: null, escala: 12 };
  }
  return { tipo: "degradado", desde: base, hasta: actual?.tipo === "degradado" ? actual.hasta : "#2563EB", angulo: actual?.tipo === "degradado" ? actual.angulo : 90 };
}

export const PATRONES_DE_RELLENO: ReadonlyArray<{ valor: PatronRelleno; etiqueta: string }> = [
  { valor: "rayas", etiqueta: "Rayas" },
  { valor: "diagonal", etiqueta: "Diagonal" },
  { valor: "cuadricula", etiqueta: "Cuadrícula" },
  { valor: "puntos", etiqueta: "Lunares" },
];

export type FormaDeDegradado = "lineal" | "radial";

/** Una copia del objeto sin la clave `clave` (los campos opcionales de Y23 se quitan, no se ponen en `undefined`). */
function sinClave<T extends object, K extends keyof T>(o: T, clave: K): Omit<T, K> {
  const copia = { ...o };
  delete copia[clave];
  return copia;
}

/** Lineal o radial. El ángulo y las paradas se conservan al cambiar de uno a otro. Lineal no escribe el campo (lo de antes). */
export function conFormaDeDegradado(r: RellenoDegradado, forma: FormaDeDegradado): RellenoDegradado {
  const resto = sinClave(r, "forma");
  return forma === "radial" ? { ...resto, forma: "radial" } : resto;
}

const TOPE_PARADAS = LIMITES.paradasDegradado;
const POSICION_MIN = LIMITES.paradaPosicion.min;
const POSICION_MAX = LIMITES.paradaPosicion.max;
const r2d = (v: number): number => Math.round(v * 100) / 100;

export const MAX_PARADAS = TOPE_PARADAS;
export const paradasDe = (r: RellenoDegradado): readonly ParadaDegradado[] => r.paradas ?? [];

/** El promedio de dos colores `#rrggbb`/`#rgb`/`#rrggbbaa` (sin el alfa) o, si alguno es un token del tema, el primero. */
export function mezclarColores(a: string, b: string): string {
  const canales = (c: string): number[] | null => {
    const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(c);
    if (!m) return null;
    const h = m[1] as string;
    const x = h.length === 3 ? [...h].map((d) => d + d).join("") : h.slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
  };
  const ca = canales(a);
  const cb = canales(b);
  if (!ca || !cb) return a;
  return `#${ca.map((v, i) => Math.round((v + (cb[i] as number)) / 2).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** La lista de paradas, ordenada de menor a mayor; vacía = sin el campo. */
function conParadas(r: RellenoDegradado, paradas: readonly ParadaDegradado[]): RellenoDegradado {
  const resto = sinClave(r, "paradas");
  return paradas.length === 0 ? resto : { ...resto, paradas: [...paradas].sort((x, y) => x.posicion - y.posicion) };
}

/**
 * Una parada nueva en el punto medio del tramo más ancho (el primero si empatan), con el promedio de los dos colores vecinos
 * (o el de la izquierda si alguno es un token). Con el tope de paradas devuelve el mismo relleno.
 */
export function agregarParada(r: RellenoDegradado): RellenoDegradado {
  const paradas = paradasDe(r);
  if (paradas.length >= TOPE_PARADAS) return r;
  const puntos = [{ posicion: 0, color: r.desde }, ...paradas, { posicion: 1, color: r.hasta }];
  let mejor = 0;
  for (let i = 1; i < puntos.length - 1; i++) {
    if ((puntos[i + 1] as ParadaDegradado).posicion - (puntos[i] as ParadaDegradado).posicion > (puntos[mejor + 1] as ParadaDegradado).posicion - (puntos[mejor] as ParadaDegradado).posicion) mejor = i;
  }
  const izq = puntos[mejor] as ParadaDegradado;
  const der = puntos[mejor + 1] as ParadaDegradado;
  // El tramo más ancho mide al menos 1/4 y sus extremos están en [0; 0,95] ∪ [0,05; 1]: el medio siempre cae en [0,05; 0,95].
  const posicion = r2d((izq.posicion + der.posicion) / 2);
  return conParadas(r, [...paradas, { posicion, color: mezclarColores(izq.color, der.color) }]);
}

export const quitarParada = (r: RellenoDegradado, i: number): RellenoDegradado => conParadas(r, paradasDe(r).filter((_p, k) => k !== i));

/** Cambia la posición (acotada) o el color de la parada `i`; las paradas quedan ordenadas. */
export function cambiarParada(r: RellenoDegradado, i: number, parche: Partial<ParadaDegradado>): RellenoDegradado {
  const paradas = paradasDe(r);
  if (!paradas[i]) return r;
  const nueva = { ...paradas[i], ...parche, posicion: Math.min(POSICION_MAX, Math.max(POSICION_MIN, r2d(parche.posicion ?? (paradas[i] as ParadaDegradado).posicion))) };
  return conParadas(r, paradas.map((p, k) => (k === i ? nueva : p)));
}

/** Pone o quita «interior» en la sombra de los elegidos que tienen una (la proyectada no escribe el campo: lo de antes). */
export const fijarSombraInterior = (escena: Escena, destino: readonly Hoja[], interior: boolean): Escena =>
  fijarSombra(escena, destino, (s) => {
    if (!s) return s;
    const resto = sinClave(s, "interior");
    return interior ? { ...resto, interior: true } : resto;
  });

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
