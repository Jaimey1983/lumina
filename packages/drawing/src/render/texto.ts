import type { Vinetas } from '../tipos.js';

// ─── Texto de formas y rótulos (W3) ───────────────────────────────────────────
// No se puede medir texto sin DOM, así que el ajuste de línea usa un ancho medio
// por carácter. Es una estimación: suficiente para que el texto no se salga de la
// forma en la mayoría de los casos.

export const INTERLINEADO = 1.25;

/** Ancho medio de un carácter, como fracción del tamaño de letra. */
export function anchoMedioCaracter(negrita: boolean): number {
  return negrita ? 0.55 : 0.5;
}

/**
 * Parte `texto` en líneas que caben en `anchoDisponible`; respeta los saltos de línea.
 * Con `partirPalabras` (por defecto) corta también las palabras más largas que una línea;
 * sin él, esas palabras quedan enteras y se salen un poco de la zona.
 */
export function lineasDeTexto(texto: string, anchoDisponible: number, tamano: number, negrita: boolean, partirPalabras = true): string[] {
  const maxCaracteres = Math.max(1, Math.floor(anchoDisponible / (tamano * anchoMedioCaracter(negrita))));
  const lineas: string[] = [];
  for (const parrafo of texto.split(/\r?\n/)) {
    const palabras = parrafo.split(/\s+/).filter(Boolean);
    if (palabras.length === 0) {
      lineas.push('');
      continue;
    }
    let actual = '';
    for (let palabra of palabras) {
      while (partirPalabras && palabra.length > maxCaracteres) {
        if (actual) {
          lineas.push(actual);
          actual = '';
        }
        lineas.push(palabra.slice(0, maxCaracteres));
        palabra = palabra.slice(maxCaracteres);
      }
      const candidata = actual ? `${actual} ${palabra}` : palabra;
      // Una palabra que sola no cabe (y no se parte) ocupa su línea entera, sin dejar una línea vacía antes.
      if (candidata.length <= maxCaracteres || actual === '') {
        actual = candidata;
      } else {
        lineas.push(actual);
        actual = palabra;
      }
    }
    if (actual) lineas.push(actual);
  }
  return lineas;
}

/** Una línea ya partida; `marca` solo está en la primera línea de cada párrafo de una lista (Y24a). */
export interface LineaDeTexto {
  texto: string;
  marca?: string;
}

export interface ComposicionDeTexto {
  lineas: LineaDeTexto[];
  /** Ancho que se deja a la izquierda del texto para las marcas; 0 sin lista. */
  sangria: number;
}

/**
 * Parte el texto en líneas como `lineasDeTexto`, pero con lista: cada párrafo con texto lleva una marca (`•`, o `1.`, `2.`…
 * contando solo los párrafos con texto) en su primera línea, y todo el texto se sangra lo mismo —el ancho estimado de la
 * marca más ancha más un espacio—, así que el ancho que queda para las palabras baja en esa sangría. Sin lista devuelve
 * exactamente las líneas de `lineasDeTexto`.
 */
export function componerTexto(texto: string, anchoDisponible: number, tamano: number, negrita: boolean, vinetas?: Vinetas, partirPalabras = true): ComposicionDeTexto {
  if (!vinetas) return { lineas: lineasDeTexto(texto, anchoDisponible, tamano, negrita, partirPalabras).map((t) => ({ texto: t })), sangria: 0 };
  const parrafos = texto.split(/\r?\n/);
  let numero = 0;
  const marcas = parrafos.map((p) => (p.split(/\s+/).some(Boolean) ? (vinetas === 'puntos' ? '•' : `${++numero}.`) : undefined));
  const largoMax = Math.max(0, ...marcas.map((m) => m?.length ?? 0));
  const sangria = largoMax === 0 ? 0 : (largoMax + 1) * tamano * anchoMedioCaracter(negrita);
  const lineas: LineaDeTexto[] = [];
  parrafos.forEach((parrafo, i) => {
    lineasDeTexto(parrafo, anchoDisponible - sangria, tamano, negrita, partirPalabras).forEach((t, k) => {
      const marca = k === 0 ? marcas[i] : undefined;
      lineas.push(marca ? { texto: t, marca } : { texto: t });
    });
  });
  return { lineas, sangria };
}

export interface TextoAjustado {
  tamano: number;
  lineas: string[];
}

export interface ComposicionAjustada extends ComposicionDeTexto {
  tamano: number;
}

/**
 * Autoajuste: la letra más grande (hasta `tamano`, nunca menos de `minimo`) con la que el texto
 * cabe en la zona sin partir palabras. Si ni con `minimo` cabe, se usa `minimo` y se parten las
 * palabras que no entren. Con lista, la sangría de cada tamaño cuenta en el ancho.
 */
export function ajustarComposicion(texto: string, ancho: number, alto: number, tamano: number, negrita: boolean, vinetas?: Vinetas, minimo = 8): ComposicionAjustada {
  const piso = Math.min(minimo, tamano);
  for (let t = tamano; t >= piso; t -= 0.5) {
    const c = componerTexto(texto, ancho, t, negrita, vinetas, false);
    const cabeEnAlto = c.lineas.length * t * INTERLINEADO <= alto;
    const cabeEnAncho = c.lineas.every((l) => l.texto.length * t * anchoMedioCaracter(negrita) <= ancho - c.sangria);
    if (cabeEnAlto && cabeEnAncho) return { tamano: t, ...c };
  }
  return { tamano: piso, ...componerTexto(texto, ancho, piso, negrita, vinetas, true) };
}

/**
 * Autoajuste sin lista: la letra más grande (hasta `tamano`, nunca menos de `minimo`) con la que el texto
 * cabe en la zona sin partir palabras. Si ni con `minimo` cabe, se usa `minimo` y se parten las
 * palabras que no entren.
 */
export function ajustarTexto(texto: string, ancho: number, alto: number, tamano: number, negrita: boolean, minimo = 8): TextoAjustado {
  const { tamano: t, lineas } = ajustarComposicion(texto, ancho, alto, tamano, negrita, undefined, minimo);
  return { tamano: t, lineas: lineas.map((l) => l.texto) };
}

/**
 * El alto que ocupan las líneas del texto **sin reducir la letra** (Y24b): lo que necesita una caja para que el texto quepa tal como
 * está. Usa la misma composición que el render (palabras enteras, con la sangría de las viñetas); no incluye el relleno de la zona.
 */
export function altoDeTexto(texto: string, anchoUtil: number, estilo: { tamano: number; negrita: boolean; vinetas?: Vinetas }): number {
  const { lineas } = componerTexto(texto, anchoUtil, estilo.tamano, estilo.negrita, estilo.vinetas, false);
  return lineas.length * estilo.tamano * INTERLINEADO;
}
