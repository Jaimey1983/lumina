// ─── Conectores en el editor (W7) ─────────────────────────────────────────────
// Lógica pura (sin React ni DOM) de lo que el editor hace con las líneas pegadas a formas: qué
// asas ofrece una línea seleccionada, cómo se arrastra un extremo o un punto intermedio y a qué
// puerto se pega un extremo al dibujar. Mismo patrón que `gestos.ts`: cada fotograma se calcula
// desde la escena inicial, así el arrastre no acumula error y soltar es una sola entrada de historial.

import {
  actualizar,
  cambiarEstilo,
  conectar,
  conectarFormas,
  elementoEn,
  existeConector,
  insertarVia,
  moverVia,
  puertoCercano,
  puertosDeEscena,
  puertosParaConectar,
  puntoDePuerto,
  puntoMedio,
  quitarVia,
  sincronizarConectores,
  soltarExtremo,
  trazadoDeLinea,
  type Conexion,
  type Escena,
  type Extremo,
  type Forma,
  type Linea,
  type Punto,
  type PuertoCercano,
  type Trazado,
} from "@lumina/drawing";
import { bloqueadosEfectivos } from "./asas.js";

/** Distancia (píxeles de pantalla) a la que un puerto atrae a un extremo. */
export const RADIO_PUERTO_PX = 14;
/** Lo mismo con el dedo: la yema es mucho menos precisa que el puntero (y tapa lo que toca). */
export const RADIO_PUERTO_TACTIL_PX = 24;
/** Tolerancia (píxeles de pantalla) para agarrar una asa del conector. */
export const TOLERANCIA_AGARRE_PX = 9;
/** Radio de las esquinas redondeadas de un conector ortogonal. */
export const RADIO_ESQUINA = 14;

export type Agarre =
  | { tipo: "extremo"; cual: "origen" | "destino"; punto: Punto }
  | { tipo: "via"; indice: number; punto: Punto }
  | { tipo: "insertar"; tramo: number; punto: Punto };

/** La línea seleccionada, si lo seleccionado es exactamente una línea que se puede editar. */
export function lineaUnica(escena: Escena, seleccion: readonly string[]): Linea | null {
  if (seleccion.length !== 1) return null;
  const e = escena.elementos.find((x) => x.id === seleccion[0]);
  if (e?.tipo !== "linea" || bloqueadosEfectivos(escena).has(e.id)) return null;
  return e;
}

/** Asas de una línea: sus dos extremos, sus puntos intermedios y un punto para crear uno nuevo en cada tramo. */
export function agarresDeConector(escena: Escena, linea: Linea): Agarre[] {
  const t = trazadoDeLinea(escena, linea);
  const salida: Agarre[] = [
    { tipo: "extremo", cual: "origen", punto: t.inicio },
    { tipo: "extremo", cual: "destino", punto: t.fin },
  ];
  for (let i = 1; i < linea.puntos.length - 1; i++) salida.push({ tipo: "via", indice: i, punto: { ...(linea.puntos[i] as Punto) } });
  t.tramos.forEach((tramo, i) => salida.push({ tipo: "insertar", tramo: i, punto: puntoMedio(tramo) }));
  return salida;
}

/** Asa bajo `punto` (coordenadas de escena): extremos y puntos intermedios mandan sobre los de crear uno nuevo. */
export function agarreEn(escena: Escena, linea: Linea, punto: Punto, zoom: number): Agarre | null {
  const tol = TOLERANCIA_AGARRE_PX / zoom;
  const cerca = (a: Agarre): boolean => Math.hypot(a.punto.x - punto.x, a.punto.y - punto.y) <= tol;
  const todos = agarresDeConector(escena, linea);
  for (const tipo of ["extremo", "via", "insertar"] as const) {
    const a = todos.find((g) => g.tipo === tipo && cerca(g));
    if (a) return a;
  }
  return null;
}

// ─── Gestos ───────────────────────────────────────────────────────────────────

export type GestoConector =
  | { tipo: "extremo"; base: Escena; id: string; cual: "origen" | "destino" }
  | { tipo: "via"; base: Escena; id: string; indice: number }
  | { tipo: "insertar"; base: Escena; id: string; tramo: number };

export function iniciarConector(base: Escena, id: string, agarre: Agarre): GestoConector {
  if (agarre.tipo === "extremo") return { tipo: "extremo", base, id, cual: agarre.cual };
  if (agarre.tipo === "via") return { tipo: "via", base, id, indice: agarre.indice };
  return { tipo: "insertar", base, id, tramo: agarre.tramo };
}

export interface EntradaConector {
  /** Posición del puntero en la escena, sin imantar. */
  puntero: Punto;
  /** Esa misma posición con el imán de cuadrícula y guías (para lo que queda libre). */
  imantado: Punto;
  zoom: number;
  /** Ctrl: sin imán de puertos. */
  sinImanDePuertos: boolean;
  /** Radio de atracción de los puertos en píxeles de pantalla (mayor con el dedo). Por defecto, `RADIO_PUERTO_PX`. */
  radioPx?: number;
}

export interface ResultadoConector {
  escena: Escena;
  /** Puerto al que está pegado el extremo que se arrastra (para resaltarlo). */
  puerto: PuertoCercano | null;
}

export function avanzarConector(g: GestoConector, e: EntradaConector): ResultadoConector {
  if (g.tipo === "extremo") {
    const radio = e.sinImanDePuertos ? 0 : (e.radioPx ?? RADIO_PUERTO_PX) / e.zoom;
    const cerca = radio > 0 ? puertoCercano(g.base, e.puntero, radio) : null;
    const r = soltarExtremo(g.base, g.id, g.cual, cerca ? e.puntero : e.imantado, { radio: cerca ? radio : 0 });
    return { escena: sincronizarConectores(r.escena), puerto: r.puerto };
  }
  if (g.tipo === "via") return { escena: sincronizarConectores(moverVia(g.base, g.id, g.indice, e.imantado)), puerto: null };
  return { escena: sincronizarConectores(insertarVia(g.base, g.id, g.tramo, e.imantado)), puerto: null };
}

/** Quita el punto intermedio `indice` (doble clic sobre su asa). */
export const quitarPuntoIntermedio = (escena: Escena, id: string, indice: number): Escena => sincronizarConectores(quitarVia(escena, id, indice));

// ─── Al dibujar una línea ─────────────────────────────────────────────────────

export interface PuntoDeLinea {
  punto: Punto;
  /** Puerto al que se pegó el punto, si lo hubo. */
  puerto: PuertoCercano | null;
}

/**
 * Dónde cae un punto de la línea que se está dibujando: pegado al puerto cercano si lo hay (Ctrl lo
 * suspende); si no, el punto ya imantado (con Mayús, restringido por `restringir`).
 */
export function resolverPuntoDeLinea(
  escena: Escena,
  puntero: Punto,
  imantado: Punto,
  opciones: { zoom: number; sinImanDePuertos: boolean; radioPx?: number; restringir?: (p: Punto) => Punto },
): PuntoDeLinea {
  const cerca = opciones.sinImanDePuertos ? null : puertoCercano(escena, puntero, (opciones.radioPx ?? RADIO_PUERTO_PX) / opciones.zoom);
  if (cerca) return { punto: { ...cerca.punto }, puerto: cerca };
  return { punto: opciones.restringir ? opciones.restringir(imantado) : imantado, puerto: null };
}

/** Radio de atracción de los puertos según el tipo de puntero del navegador (`PointerEvent.pointerType`). */
export const radioDePuertoPx = (tipoPuntero: string | undefined): number => (tipoPuntero === "touch" ? RADIO_PUERTO_TACTIL_PX : RADIO_PUERTO_PX);

// ─── Puertos al pasar el cursor y forma destino (Y6) ──────────────────────────

/** Los ids pedidos más, si alguno es un grupo, todos sus descendientes. */
function conHijos(escena: Escena, ids: readonly string[]): Set<string> {
  const salida = new Set<string>();
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const sumar = (id: string): void => {
    if (salida.has(id)) return;
    salida.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(sumar);
  };
  ids.forEach(sumar);
  return salida;
}

const esFormaElegible = (escena: Escena, id: string | undefined): id is string => {
  if (id === undefined) return false;
  const e = escena.elementos.find((x) => x.id === id);
  return e?.tipo === "forma" && !bloqueadosEfectivos(escena).has(id);
};

/**
 * Forma cuyos puertos se muestran con el cursor encima (herramienta de seleccionar), o `null`. Es la forma de
 * más arriba bajo el puntero —no una línea ni un texto que la tape—, siempre visible y desbloqueada.
 *
 * Con histéresis: los puertos están en el borde de la forma, y para llegar a uno el cursor sale de ella. Si
 * `anterior` sigue siendo válida y el puntero está a menos de `radioPx` de alguno de sus puertos, se conserva;
 * si no, los puertos desaparecerían justo antes de poder tocarlos (parpadeo).
 */
export function formaConPuertosVisibles(escena: Escena, punto: Punto, zoom: number, anterior: string | null, radioPx: number = RADIO_PUERTO_PX): string | null {
  if (anterior !== null && esFormaElegible(escena, anterior)) {
    const cerca = puertosDeEscena(escena).some((p) => p.elementoId === anterior && Math.hypot(p.punto.x - punto.x, p.punto.y - punto.y) <= radioPx / zoom);
    if (cerca) return anterior;
  }
  const bajo = elementoEn(escena, punto, { tolerancia: 6 / zoom, entrarEnGrupos: true });
  return esFormaElegible(escena, bajo) ? bajo : null;
}

/**
 * La escena sin lo que se arrastra (ni los hijos de un grupo que se arrastra) y sin líneas: para buscar qué forma
 * hay debajo. Las líneas no cuentan: un conector que sale de un puerto pasa justo por donde se suelta para
 * colgar otra caja de ese padre, y no debe taparlo.
 */
function sinArrastradas(escena: Escena, arrastrados: readonly string[]): Escena {
  const fuera = conHijos(escena, arrastrados);
  return {
    ...escena,
    elementos: escena.elementos
      .filter((e) => !fuera.has(e.id) && e.tipo !== "linea")
      .map((e) => (e.tipo === "grupo" ? { ...e, hijos: e.hijos.filter((h) => !fuera.has(h)) } : e)),
  };
}

/**
 * Forma que sería el destino de lo que se arrastra: la de más arriba bajo el puntero sin contar lo que se
 * mueve (ni los hijos de un grupo que se mueve). Es una forma visible y desbloqueada, o `null`.
 */
export function formaDestinoDeArrastre(escena: Escena, punto: Punto, zoom: number, arrastrados: readonly string[]): string | null {
  const resto = sinArrastradas(escena, arrastrados);
  const bajo = elementoEn(resto, punto, { tolerancia: 6 / zoom, entrarEnGrupos: true });
  return esFormaElegible(resto, bajo) ? bajo : null;
}

// ─── Conectar al soltar una forma sobre otra (Y7, DY4) ────────────────────────
// Al arrastrar una forma sobre otra, soltar solo la mueve (se solapan). Conecta únicamente si el puntero cae
// sobre el halo de un puerto de la de debajo, o con `Alt` apretada; antes de soltar se ve qué va a pasar.
// La de debajo es el «padre» (el origen del conector) y la que se arrastró, la «hija» (su destino): así
// una caja nueva soltada sobre un título cuelga de él.

/**
 * La forma cuyo puerto está a menos de `radioPx` (píxeles de pantalla) del puntero —el halo que arma la
 * conexión—, sin contar lo que se arrastra. Puede estar fuera de la forma: los puertos están en el borde y el
 * puntero también puede quedar un poco más allá. Con dos a la misma distancia, la de más arriba.
 */
export function formaEnHalo(escena: Escena, punto: Punto, zoom: number, arrastrados: readonly string[], radioPx: number = RADIO_PUERTO_PX): string | null {
  const resto = sinArrastradas(escena, arrastrados);
  const elegibles = new Set(resto.elementos.filter((e) => esFormaElegible(resto, e.id)).map((e) => e.id));
  let mejor: { id: string; distancia: number } | null = null;
  for (const p of puertosDeEscena(resto)) {
    if (!elegibles.has(p.elementoId)) continue;
    const distancia = Math.hypot(p.punto.x - punto.x, p.punto.y - punto.y);
    if (distancia > radioPx / zoom) continue;
    if (!mejor || distancia <= mejor.distancia) mejor = { id: p.elementoId, distancia };
  }
  return mejor ? mejor.id : null;
}

export { existeConector };

export interface IntencionDeSoltar {
  /** Forma sobre la que va lo que se arrastra (se resalta), o `null`. */
  destino: string | null;
  /** Si al soltar ahora se crearía un conector. */
  conecta: boolean;
  /** El conector que se crearía, de puerto a puerto (para la vista previa). */
  previa: { desde: Punto; hasta: Punto } | null;
}

/**
 * Qué pasaría si se soltara ahora. `escena` es la actual (con lo arrastrado ya movido), `agarrada` la forma por
 * la que se tomó el arrastre (la «hija»: con varias formas elegidas, solo esa se conecta). No hay conexión si
 * no hay una hija que sea forma entre lo arrastrado, si ya existe ese conector o si no se arma (ni halo ni Alt).
 */
export function intencionDeArrastre(
  escena: Escena,
  punto: Punto,
  zoom: number,
  arrastrados: readonly string[],
  agarrada: string | undefined,
  alt: boolean,
  radioPx: number = RADIO_PUERTO_PX,
): IntencionDeSoltar {
  // El halo de un puerto manda (aunque el puntero esté un poco fuera de la forma); si no, la forma que hay debajo.
  const enHalo = formaEnHalo(escena, punto, zoom, arrastrados, radioPx);
  const destino = enHalo ?? formaDestinoDeArrastre(escena, punto, zoom, arrastrados);
  const sinConexion: IntencionDeSoltar = { destino, conecta: false, previa: null };
  if (destino === null || agarrada === undefined) return sinConexion;
  if (enHalo === null && !alt) return sinConexion;
  if (!conHijos(escena, arrastrados).has(agarrada) || !esFormaElegible(escena, agarrada)) return sinConexion;
  if (existeConector(escena, destino, agarrada)) return sinConexion;
  const par = puertosParaConectar(escena, destino, agarrada);
  const padre = escena.elementos.find((e): e is Forma => e.id === destino && e.tipo === "forma");
  const hija = escena.elementos.find((e): e is Forma => e.id === agarrada && e.tipo === "forma");
  if (!par || !padre || !hija) return sinConexion;
  return { destino, conecta: true, previa: { desde: puntoDePuerto(padre, par.origen.puerto), hasta: puntoDePuerto(hija, par.destino.puerto) } };
}

/** La escena con un conector nuevo del padre a la hija (delega al motor puro). */
export const conectarAlSoltar = conectarFormas;

export const aConexion = (p: PuertoCercano | null): Conexion | undefined => (p ? { elementoId: p.elementoId, puerto: p.puerto } : undefined);

// ─── Extremo libre (Y10) ──────────────────────────────────────────────────────

/** Extremos de la línea que no están unidos a una forma. */
export function extremosLibres(linea: Linea): Array<"origen" | "destino"> {
  const r: Array<"origen" | "destino"> = [];
  if (linea.origen === undefined) r.push("origen");
  if (linea.destino === undefined) r.push("destino");
  return r;
}

export const hayExtremoLibre = (linea: Linea): boolean => extremosLibres(linea).length > 0;

/** Hay al menos un conector elegido con un extremo suelto. */
export function hayConectorConExtremoLibre(escena: Escena, seleccion: readonly string[]): boolean {
  return lineasElegidas(escena, seleccion).some(hayExtremoLibre);
}

/**
 * Puerto más cercano a `punto` de una forma visible y desbloqueada. No considera la propia línea
 * (las líneas no tienen puertos) ni formas bloqueadas u ocultas.
 */
export function puertoMasCercanoElegible(escena: Escena, punto: Punto, lineaId: string): PuertoCercano | null {
  const bloqueados = bloqueadosEfectivos(escena);
  let mejor: PuertoCercano | null = null;
  for (const p of puertosDeEscena(escena)) {
    if (p.elementoId === lineaId) continue;
    if (bloqueados.has(p.elementoId)) continue;
    const distancia = Math.hypot(p.punto.x - punto.x, p.punto.y - punto.y);
    if (!mejor || distancia <= mejor.distancia) mejor = { ...p, distancia };
  }
  return mejor;
}

/**
 * Pega cada extremo libre de las líneas elegidas al puerto más cercano de una forma visible y
 * desbloqueada. Un solo resultado: sirve como una entrada de historial.
 */
export function pegarAlMasCercano(escena: Escena, ids: readonly string[]): Escena {
  const lineas = lineasElegidas(escena, ids);
  let actual = escena;
  for (const l of lineas) {
    const linea = actual.elementos.find((e): e is Linea => e.id === l.id && e.tipo === "linea");
    if (!linea) continue;
    for (const cual of extremosLibres(linea)) {
      const extremo = cual === "origen" ? linea.puntos[0] : linea.puntos[linea.puntos.length - 1];
      if (!extremo) continue;
      const cerca = puertoMasCercanoElegible(actual, extremo, linea.id);
      if (!cerca) continue;
      actual = conectar(actual, linea.id, cual, { elementoId: cerca.elementoId, puerto: cerca.puerto });
    }
  }
  return actual === escena ? escena : sincronizarConectores(actual);
}

// ─── Barra del conector ───────────────────────────────────────────────────────

export const TRAZADOS_OPCIONES: ReadonlyArray<{ valor: Trazado; etiqueta: string }> = [
  { valor: "recto", etiqueta: "Recto" },
  { valor: "ortogonal", etiqueta: "En ángulo recto" },
  { valor: "curvo", etiqueta: "Curvo" },
];

export const EXTREMOS_OPCIONES: ReadonlyArray<{ valor: Extremo; etiqueta: string }> = [
  { valor: "ninguno", etiqueta: "Ninguno" },
  { valor: "flecha", etiqueta: "Flecha" },
  { valor: "flecha-abierta", etiqueta: "Flecha abierta" },
  { valor: "circulo", etiqueta: "Círculo" },
  { valor: "rombo", etiqueta: "Rombo" },
];

/** Líneas entre los elementos elegidos (la barra del conector aparece si lo elegido son solo líneas). */
export function lineasElegidas(escena: Escena, seleccion: readonly string[]): Linea[] {
  const elegidos = escena.elementos.filter((e) => seleccion.includes(e.id));
  if (elegidos.length === 0 || elegidos.some((e) => e.tipo !== "linea")) return [];
  const bloqueados = bloqueadosEfectivos(escena);
  return elegidos.filter((e): e is Linea => e.tipo === "linea" && !bloqueados.has(e.id));
}

export const cambiarTrazado = (escena: Escena, ids: readonly string[], trazado: Trazado): Escena => actualizar(escena, ids, { trazado });
export const cambiarExtremo = (escena: Escena, ids: readonly string[], cual: "inicio" | "fin", extremo: Extremo): Escena => actualizar(escena, ids, { [cual]: extremo });
export const cambiarEsquinas = (escena: Escena, ids: readonly string[], redondeadas: boolean): Escena =>
  cambiarEstilo(escena, ids, { estilo: { radio: redondeadas ? RADIO_ESQUINA : 0 } });

/** Valor común de una propiedad entre varias líneas, o `null` si difieren. */
export function valorComun<T>(lineas: readonly Linea[], leer: (l: Linea) => T): T | null {
  const primero = lineas[0];
  if (!primero) return null;
  const v = leer(primero);
  return lineas.every((l) => leer(l) === v) ? v : null;
}

/**
 * Selección sin las líneas que ya siguen a una forma elegida. Alinear y distribuir mueven pieza por
 * pieza: una línea pegada que se moviera sola se despegaría; así que se deja que siga a su forma.
 */
export function sinConectoresQueSiguen(escena: Escena, seleccion: readonly string[]): string[] {
  const porId = new Map(escena.elementos.map((e) => [e.id, e]));
  const incluidos = new Set<string>();
  const sumar = (id: string): void => {
    if (incluidos.has(id)) return;
    incluidos.add(id);
    const e = porId.get(id);
    if (e?.tipo === "grupo") e.hijos.forEach(sumar);
  };
  seleccion.forEach(sumar);
  return seleccion.filter((id) => {
    const e = porId.get(id);
    return !(e?.tipo === "linea" && ((e.origen && incluidos.has(e.origen.elementoId)) || (e.destino && incluidos.has(e.destino.elementoId))));
  });
}
