/**
 * U10.3 — normalización de palabras compartida por los juegos de palabras (etapa U).
 *
 * Quita las tildes (`á`→`A`, `ü`→`U`) y pasa a mayúsculas, pero **conserva la `Ñ`**: en español es
 * una letra propia, no una `N` con tilde (el viejo `normalize('NFD')` la descomponía en `N` + `~` y
 * el `~` se perdía, así que «niño» se jugaba como «NINO» y la tecla Ñ contaba como fallo).
 * `@lumina/scoring` ya trataba la Ñ como letra distinta; ahora el viewer coincide con él.
 */
const MARCA_ENIE = '';

/** Mayúsculas sin tildes y con la `Ñ` intacta. No toca espacios ni signos. */
export function sinTildes(texto: string): string {
  return texto
    .replace(/ñ/gi, MARCA_ENIE)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(new RegExp(MARCA_ENIE, 'g'), 'Ñ');
}

/** Palabra o frase jugable: solo letras A–Z y Ñ, espacios simples y sin bordes. */
export function normalizarPalabra(raw: string): string {
  return sinTildes(raw)
    .replace(/[^A-ZÑ\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
