/**
 * U12.2 / DU10 — lectura de lo que el docente pega: una fila por ítem, columnas separadas por
 * tabulador, `;`, `|` o `,` (en ese orden de preferencia; el tabulador es lo que llega al pegar
 * desde una hoja de cálculo). Entiende comillas de CSV (`"a;b"`, `""` para una comilla) y campos
 * con saltos de línea entre comillas. Es pura y no interpreta el contenido: solo devuelve celdas.
 */

const SEPARADORES = ['\t', ';', '|', ','] as const;

/**
 * Separador de columnas del texto pegado, mirando la primera fila (lógica: una celda entre comillas
 * puede traer saltos de línea) y solo fuera de comillas.
 */
export function detectarSeparador(texto: string): string {
  const hallados = new Set<string>();
  let enComillas = false;
  let visto = false;
  for (const ch of texto) {
    if (ch === '"') {
      enComillas = !enComillas;
      visto = true;
    } else if (!enComillas && (ch === '\n' || ch === '\r')) {
      if (visto) break;
    } else if (!enComillas && (SEPARADORES as readonly string[]).includes(ch)) {
      hallados.add(ch);
      visto = true;
    } else if (ch.trim()) visto = true;
  }
  return SEPARADORES.find((s) => hallados.has(s)) ?? '\t';
}

/** Filas de celdas ya recortadas. Las filas totalmente vacías se descartan. */
export function parsearTabla(texto: string): string[][] {
  if (!texto || !texto.trim()) return [];
  const sep = detectarSeparador(texto);
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let enComillas = false;
  const cerrarCelda = () => {
    fila.push(celda.trim());
    celda = '';
  };
  const cerrarFila = () => {
    cerrarCelda();
    if (fila.some((c) => c.length > 0)) filas.push(fila);
    fila = [];
  };
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]!;
    if (enComillas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i += 1;
        } else enComillas = false;
      } else celda += ch;
    } else if (ch === '"' && celda.trim() === '') {
      enComillas = true;
      celda = '';
    } else if (ch === sep) cerrarCelda();
    else if (ch === '\n') cerrarFila();
    else if (ch === '\r') {
      /* se ignora: el \n cierra la fila */
    } else celda += ch;
  }
  cerrarFila();
  return filas;
}

/** Quita un acento para comparar encabezados («Opción» ≡ «opcion»). */
export const sinAcentos = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
