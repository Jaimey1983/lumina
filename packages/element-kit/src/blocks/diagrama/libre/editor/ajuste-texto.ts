// ─── Ajustar al texto: lo que el editor necesita de `@lumina/drawing` (Y24b) ──
// Puro, sin React. Envuelve `ajustarAlTexto` para el comando (con su motivo y una memoria de la última cuenta), para el anuncio y para
// el aviso del panel.

import { ajustarAlTexto, estadoDelTexto, type CambioDeAjuste, type Escena, type EstadoDelTexto, type Forma, type ResultadoDeAjuste, type Texto } from "@lumina/drawing";
import { hojasEditables } from "./propiedades.js";

let ultimo: { escena: Escena; seleccion: readonly string[]; resultado: ResultadoDeAjuste } | null = null;

/** `ajustarAlTexto` con el alto que pide el comando explícito (crece o encoge). Recuerda la última cuenta: el registro lo consulta varias veces por dibujo. */
export function ajusteDeSeleccion(escena: Escena, seleccion: readonly string[]): ResultadoDeAjuste {
  if (ultimo && ultimo.escena === escena && ultimo.seleccion === seleccion) return ultimo.resultado;
  const resultado = ajustarAlTexto(escena, seleccion);
  ultimo = { escena, seleccion, resultado };
  return resultado;
}

/** Las formas y textos editables elegidos que tienen texto (lo que el comando puede ajustar). */
export const elementosConTexto = (escena: Escena, seleccion: readonly string[]) =>
  hojasEditables(escena, seleccion).filter((h) => (h.tipo === "forma" ? (h.texto ?? "") : h.tipo === "texto" ? h.texto : "").trim() !== "");

/** `true` si el comando está disponible; si no, el motivo. */
export function motivoDeAjuste(escena: Escena, seleccion: readonly string[]): true | string {
  if (elementosConTexto(escena, seleccion).length === 0) return "Elige una forma o un texto con texto";
  return ajusteDeSeleccion(escena, seleccion).cambios.length > 0 ? true : "Ya cabe";
}

const unidades = (n: number): string => `${n} ${n === 1 ? "unidad" : "unidades"}`;

/** Lo que se anuncia tras ajustar: una sola forma dice cuánto cambió y por qué no llegó, varias dicen cuántas. */
export function mensajeDeAjuste(cambios: readonly CambioDeAjuste[]): string {
  if (cambios.length === 0) return "";
  const resto = (c: CambioDeAjuste): string => (c.frenadoPorVecina ? "; el texto no cabe del todo: hay una forma debajo." : c.noCabe ? "; el texto no cabe del todo." : ".");
  if (cambios.length === 1) {
    const c = cambios[0] as CambioDeAjuste;
    const d = Math.round(Math.abs(c.altoDespues - c.altoAntes));
    return `La forma ${c.altoDespues > c.altoAntes ? "creció" : "se encogió"} ${unidades(d)}${resto(c)}`;
  }
  const frenadas = cambios.filter((c) => c.frenadoPorVecina).length;
  return `${cambios.length} elementos ajustados al texto${frenadas > 0 ? `; ${frenadas} ${frenadas === 1 ? "se detuvo" : "se detuvieron"} antes de pisar una forma` : ""}.`;
}

/** Para el aviso del panel: el estado del texto de **una sola** forma o cuadro de texto elegido, o `null` si hay otra cosa. */
export function estadoDelTextoElegido(escena: Escena, seleccion: readonly string[]): EstadoDelTexto | null {
  const hojas = hojasEditables(escena, seleccion).filter((h): h is Forma | Texto => h.tipo !== "linea");
  const unica = hojas.length === 1 ? hojas[0] : undefined;
  return unica ? estadoDelTexto(unica) : null;
}
