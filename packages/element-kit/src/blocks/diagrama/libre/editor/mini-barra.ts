// ─── Mini barra flotante (Y18) ────────────────────────────────────────────────
// Lógica pura (sin React ni DOM) de la barra que flota junto a la selección: qué controles lleva, cuándo
// se ve y dónde se coloca. Los valores salen de las mismas funciones del panel (`propiedades.ts`, DY11).

import type { Escena, EstiloTexto } from "@lumina/drawing";
import { posicionesDeAsas, type Marco } from "./asas.js";
import { formaConAsasHijo, posicionesAsasHijo, RADIO_ASA_HIJO_PX, RADIO_ASA_HIJO_TACTIL_PX } from "./hijo-rapido.js";
import { SELECCIONAR } from "./herramientas.js";
import { conRelleno, hojasDeFormato, valorComun, type Valor } from "./propiedades.js";
import { escenaAPantalla, type Vista } from "./vista.js";

// ─── Qué lleva ────────────────────────────────────────────────────────────────

export interface ControlesMiniBarra {
  /** Color del relleno de las formas y textos elegidos (las líneas no tienen): el sólido, el de inicio del degradado o `""` sin relleno. */
  relleno: Valor<string> | null;
  contorno: Valor<string> | null;
  grosor: Valor<number> | null;
  tamano: Valor<number> | null;
  negrita: Valor<boolean> | null;
  cursiva: Valor<boolean> | null;
  subrayado: Valor<boolean> | null;
  alineacion: Valor<EstiloTexto["alineacionH"]> | null;
}

/** Los controles y sus valores para la selección, o `null` si la barra no tiene nada que mostrar. «Mixto» donde difiere. */
export function controlesDeMiniBarra(escena: Escena, seleccion: readonly string[]): ControlesMiniBarra | null {
  const editables = hojasDeFormato(escena, seleccion);
  if (editables.length === 0) return null;
  const conRell = editables.filter(conRelleno);
  const texto = <K extends keyof EstiloTexto>(k: K): Valor<EstiloTexto[K]> | null => valorComun(editables, (h) => h.estiloTexto[k]);
  return {
    relleno: valorComun(conRell, (h) => (h.estilo.relleno.tipo === "solido" ? h.estilo.relleno.color : h.estilo.relleno.tipo === "degradado" ? h.estilo.relleno.desde : "")),
    contorno: valorComun(editables, (h) => h.estilo.contorno.color),
    grosor: valorComun(editables, (h) => h.estilo.contorno.grosor),
    tamano: texto("tamano"),
    negrita: texto("negrita"),
    cursiva: texto("cursiva"),
    subrayado: texto("subrayado"),
    alineacion: texto("alineacionH"),
  };
}

// ─── Cuándo se ve ─────────────────────────────────────────────────────────────

/** Todo lo que, si está en curso, esconde la barra. Cada campo es una de las reglas de la ficha. */
export interface EstadoOcultar {
  /** Mover, redimensionar, girar, recuadro o lazo, arrastrar una guía o una forma de la galería, conectar. */
  gestoEnCurso: boolean;
  edicionDeTexto: boolean;
  pincel: boolean;
  /** La herramienta activa no es «Seleccionar». */
  otraHerramienta: boolean;
  menuContextual: boolean;
  /** El diálogo de esquema, el buscador de comandos o el panel de atajos. */
  dialogo: boolean;
}

/** `true` si la barra se ve: hay algo que formatear y ninguna de las razones para esconderla. */
export function miniBarraVisible(hayControles: boolean, estado: EstadoOcultar): boolean {
  if (!hayControles) return false;
  return !(estado.gestoEnCurso || estado.edicionDeTexto || estado.pincel || estado.otraHerramienta || estado.menuContextual || estado.dialogo);
}

// ─── Dónde va ─────────────────────────────────────────────────────────────────

export interface Tamano {
  ancho: number;
  alto: number;
}

/** Medidas de la barra aproximadas, mientras no se ha medido de verdad. */
export const TAMANO_MINI_BARRA: Tamano = { ancho: 440, alto: 40 };
/** Aire entre la barra y lo que rodea a la selección (marco y asas), en píxeles de pantalla. */
export const MARGEN_MINI_BARRA_PX = 8;
/** Mitad del lado de un asa dibujada: la barra no debe pisarla. */
export const MITAD_ASA_PX = 6;

export interface PosicionMiniBarra {
  /** Esquina superior izquierda, en píxeles dentro de la ventana. */
  x: number;
  y: number;
  lado: "arriba" | "abajo" | "borde";
}

/** Un círculo en píxeles de pantalla que la barra no debe pisar (los «+» de hijo rápido de Y8). */
export interface Circulo {
  x: number;
  y: number;
  radio: number;
}

/** Los «+» de hijo rápido que se ven con esta selección (los cuatro lados de una sola forma), en píxeles de pantalla. */
export function circulosDeAsasHijo(escena: Escena, seleccion: readonly string[], vista: Vista, tactil: boolean): Circulo[] {
  const id = formaConAsasHijo({ escena, herramienta: SELECCIONAR, seleccion, gestoEnCurso: false, edicionAbierta: false });
  const posiciones = id ? posicionesAsasHijo(escena, id, vista.zoom) : null;
  const radio = tactil ? RADIO_ASA_HIJO_TACTIL_PX : RADIO_ASA_HIJO_PX;
  return (posiciones ?? []).map((p) => ({ ...escenaAPantalla(vista, p.centro), radio }));
}

/**
 * Dónde se coloca la barra: centrada **encima** de la selección y por encima del asa de rotar; si no cabe, **debajo**;
 * si tampoco, pegada al borde de arriba de la ventana. Siempre dentro de la ventana en horizontal. Trabaja en píxeles
 * de pantalla, así que no cambia de tamaño con el zoom. `obstaculos` son círculos más (los «+» de hijo rápido) que
 * cuentan como parte de la selección: la barra queda por fuera de ellos.
 */
export function posicionDeMiniBarra(marco: Marco, vista: Vista, ventana: Tamano, tamano: Tamano, obstaculos: readonly Circulo[] = []): PosicionMiniBarra {
  // La caja en pantalla que envuelve el marco (con su giro), todas sus asas (incluida la de rotar) y los obstáculos.
  const cuadros = [
    ...Object.values(posicionesDeAsas(marco, vista.zoom)).map((p) => escenaAPantalla(vista, p)).map((p) => ({ x: p.x, y: p.y, radio: MITAD_ASA_PX })),
    ...obstaculos,
  ];
  const izq = Math.min(...cuadros.map((c) => c.x - c.radio));
  const der = Math.max(...cuadros.map((c) => c.x + c.radio));
  const arr = Math.min(...cuadros.map((c) => c.y - c.radio));
  const aba = Math.max(...cuadros.map((c) => c.y + c.radio));

  const centro = (izq + der) / 2;
  const x = Math.max(0, Math.min(centro - tamano.ancho / 2, ventana.ancho - tamano.ancho));

  const encima = arr - MARGEN_MINI_BARRA_PX - tamano.alto;
  if (encima >= 0) return { x, y: encima, lado: "arriba" };
  const debajo = aba + MARGEN_MINI_BARRA_PX;
  if (debajo + tamano.alto <= ventana.alto) return { x, y: debajo, lado: "abajo" };
  return { x, y: 0, lado: "borde" };
}
