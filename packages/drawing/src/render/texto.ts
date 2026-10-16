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

export interface TextoAjustado {
  tamano: number;
  lineas: string[];
}

/**
 * Autoajuste: la letra más grande (hasta `tamano`, nunca menos de `minimo`) con la que el texto
 * cabe en la zona sin partir palabras. Si ni con `minimo` cabe, se usa `minimo` y se parten las
 * palabras que no entren.
 */
export function ajustarTexto(texto: string, ancho: number, alto: number, tamano: number, negrita: boolean, minimo = 8): TextoAjustado {
  const piso = Math.min(minimo, tamano);
  for (let t = tamano; t >= piso; t -= 0.5) {
    const lineas = lineasDeTexto(texto, ancho, t, negrita, false);
    const cabeEnAlto = lineas.length * t * INTERLINEADO <= alto;
    const cabeEnAncho = lineas.every((l) => l.length * t * anchoMedioCaracter(negrita) <= ancho);
    if (cabeEnAlto && cabeEnAncho) return { tamano: t, lineas };
  }
  return { tamano: piso, lineas: lineasDeTexto(texto, ancho, piso, negrita, true) };
}
