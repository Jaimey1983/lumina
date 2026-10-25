// ─── Niveles de un esquema de texto (Y36, DY56) ───────────────────────────────
// Puro: sin React ni DOM. Lee cada línea del esquema y dice a qué nivel va y con qué texto. Del bloque `diagrama` anterior no usa
// nada (su analizador `parseOutlineLines` no se toca): la limpieza de viñetas y numeración de siempre se repite acá igual, para que
// un esquema que ya funcionaba se lea idéntico (golden `__golden__/esquema-y36-viejo.json`).
//
// Orden de las señales (DY56): encabezado `#` · sangría · numeración de varios componentes (solo en líneas sin sangría).

export interface LineaConNivel {
  nivel: number;
  texto: string;
}

const ENCABEZADO = /^(#{1,6})\s+(.*)$/;
const VINETA = /^[-*•]\s+/;
const VINETA_MAS = /^\+\s+/;
/** Número del esquema con su cierre: `1.`, `2)`, `1.1.`, `1.1.1)` (como el `NUMERACION` de siempre). */
const NUMERACION_CERRADA = /^(\d+(?:\.\d+)*)[.)]\s+/;
/** Número con varios componentes sin cierre: `1.1 Idea`. Solo cuenta con contexto (ver `esNumeracionDeContexto`). */
const NUMERACION_ABIERTA = /^(\d+(?:\.\d+)+)\s+/;

/** Niveles de sangría de una línea: 2 espacios o un tabulador son un nivel (igual que siempre). */
function sangriaDe(linea: string): number {
  const margen = linea.match(/^[ \t]*/)?.[0] ?? "";
  let nivel = 0;
  for (const c of margen) nivel += c === "\t" ? 1 : c === " " ? 0.5 : 0;
  return Math.floor(nivel);
}

const componentes = (numero: string): number[] => numero.split(".").map(Number);

/**
 * `1.1 Idea` (sin punto final) es numeración solo si el número, sin su último componente, es un prefijo de la numeración del ítem
 * numerado anterior (su padre, un hermano o un ancestro): así `3.14 es pi` o `1.5 litros de agua`, sin un esquema numerado a la vista,
 * siguen siendo texto.
 */
function esNumeracionDeContexto(numero: number[], anterior: number[] | null): boolean {
  if (anterior === null || anterior.length < numero.length - 1) return false;
  return numero.slice(0, -1).every((c, i) => anterior[i] === c);
}

/**
 * Nivel y texto de cada línea no vacía. Un encabezado `#` (hasta seis) tiene el nivel de sus `#` menos uno y fija la base de las
 * líneas que siguen (`base = nivel + 1`). La sangría se suma a la base. En las líneas sin sangría, una numeración de varios
 * componentes (`1.1`, `1.1.1`) fija el nivel en `base + componentes − 1`; donde hay sangría, la sangría manda y la numeración solo se
 * quita del texto (como siempre). Lo no reconocido se conserva literal; las líneas que quedan sin texto se descartan.
 */
export function nivelesDeLineas(texto: string): LineaConNivel[] {
  const salida: LineaConNivel[] = [];
  let base = 0;
  let numeroAnterior: number[] | null = null;

  for (const cruda of texto.split("\n")) {
    if (!cruda.trim()) continue;
    const sangria = sangriaDe(cruda);
    const recortada = cruda.trim();

    const enc = ENCABEZADO.exec(recortada);
    if (enc) {
      const cuerpo = (enc[2] as string).trim();
      if (cuerpo === "") continue;
      const nivel = (enc[1] as string).length - 1;
      salida.push({ nivel, texto: cuerpo });
      base = nivel + 1;
      numeroAnterior = null;
      continue;
    }

    // La limpieza de siempre: viñeta, `1. ` simple, viñeta `+` y numeración cerrada. De lo que se quita se anota el número.
    let resto = recortada.replace(VINETA, "");
    let numero: number[] | null = null;
    const simple = /^(\d+)\.\s+/.exec(resto);
    if (simple) {
      numero = componentes(simple[1] as string);
      resto = resto.slice(simple[0].length);
    }
    resto = resto.trim().replace(VINETA_MAS, "");
    const cerrada = NUMERACION_CERRADA.exec(resto);
    if (cerrada) {
      numero = componentes(cerrada[1] as string);
      resto = resto.slice(cerrada[0].length);
    } else if (numero === null) {
      const abierta = NUMERACION_ABIERTA.exec(resto);
      if (abierta) {
        const candidato = componentes(abierta[1] as string);
        // Solo si no hay sangría: con sangría la numeración abierta es texto, como antes de Y36.
        if (sangria === 0 && esNumeracionDeContexto(candidato, numeroAnterior)) {
          numero = candidato;
          resto = resto.slice(abierta[0].length);
        }
      }
    }
    resto = resto.trim();
    if (resto === "") continue;

    if (numero !== null) numeroAnterior = numero;
    const nivel = sangria > 0 ? base + sangria : base + (numero !== null ? numero.length - 1 : 0);
    salida.push({ nivel, texto: resto });
  }
  return salida;
}
