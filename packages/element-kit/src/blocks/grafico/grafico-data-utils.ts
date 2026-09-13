// ─── Utilidades de Importación, Pegado, Transposición y Ordenamiento de Gráficos ───

import type { GraficoDatosBlock, GraficoSerie } from '@lumina/types/slide';

/**
 * Parsea texto plano proveniente de copiar/pegar desde Excel, Google Sheets, TSV o CSV.
 * Detecta automáticamente si el separador es tabulación (\t), punto y coma (;) o coma (,).
 */
export function parseClipboardTable(text: string): {
  categorias: string[];
  series: { nombre: string; valores: number[] }[];
} | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return null;

  // Detectar delimitador según frecuencia en la primera línea
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter = '\t';
  if (tabCount > 0) {
    delimiter = '\t';
  } else if (semicolonCount > 0 && semicolonCount >= commaCount) {
    delimiter = ';';
  } else if (commaCount > 0) {
    delimiter = ',';
  }

  // Parsear celdas por línea respetando comillas simples/dobles básicas
  const splitLine = (line: string): string[] => {
    if (!line.includes('"')) {
      return line.split(delimiter).map((c) => c.trim());
    }
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const matrix = lines.map(splitLine);
  if (matrix.length < 2 || matrix[0].length < 2) return null;

  // Encabezados (Fila 0): matrix[0][0] suele ser la etiqueta de categorías o vacío.
  // matrix[0][1..N] son los nombres de las series.
  const headerRow = matrix[0];
  const seriesNames = headerRow.slice(1).map((s, idx) => s || `Serie ${idx + 1}`);

  const categorias: string[] = [];
  const seriesValues: number[][] = seriesNames.map(() => []);

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    const catName = row[0] || `Fila ${r}`;
    categorias.push(catName);

    for (let s = 0; s < seriesNames.length; s++) {
      const rawCell = row[s + 1] ?? '';
      // Normalizar número:
      // Eliminar espacios y símbolos de moneda o porcentaje
      let cleaned = rawCell.replace(/\s+/g, '').replace(/[$€%]/g, '');
      if (cleaned.includes('.') && cleaned.includes(',')) {
        if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
          // Formato latino con miles y decimales: 1.500,50 -> 1500.50
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          // Formato anglosajón con miles y decimales: 1,500.50 -> 1500.50
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        // Solo tiene coma: se asume separador decimal latino (ej. 1500,50 o 1,5)
        cleaned = cleaned.replace(',', '.');
      } else if (cleaned.includes('.')) {
        // Solo tiene punto:
        // Si tiene exactamente 3 dígitos tras el punto y el delimitador de fila fue ';' (ej. "2.000"),
        // o si coincide con patrón de miles \d{1,3}(\.\d{3})+ sin parte decimal
        if (/^\d{1,3}(\.\d{3})+$/.test(cleaned) && delimiter === ';') {
          cleaned = cleaned.replace(/\./g, '');
        }
        // De lo contrario, se asume decimal estándar: 2000.5 o 2.5
      }
      const num = Number(cleaned);
      seriesValues[s].push(Number.isFinite(num) ? num : 0);
    }
  }

  if (categorias.length === 0 || seriesNames.length === 0) return null;

  const series: { nombre: string; valores: number[] }[] = seriesNames.map((nombre, i) => ({
    nombre,
    valores: seriesValues[i],
  }));

  return { categorias, series };
}

/**
 * Transpone la matriz de datos:
 * Las categorías pasan a ser nombres de series y los nombres de series pasan a ser categorías.
 */
export function transposeChartData(block: GraficoDatosBlock): {
  categorias: string[];
  series: GraficoSerie[];
} {
  const oldCats = block.categorias;
  const oldSeries = block.series;

  if (oldCats.length === 0 || oldSeries.length === 0) {
    return { categorias: block.categorias, series: block.series };
  }

  // Nuevas categorías = nombres de las series anteriores
  const newCategorias = oldSeries.map((s, i) => s.nombre || `Serie ${i + 1}`);

  // Nuevas series = cantidad de categorías anteriores
  const newSeries: GraficoSerie[] = oldCats.map((cat, catIdx) => {
    const valores = oldSeries.map((s) => s.valores[catIdx] ?? 0);
    return {
      nombre: cat || `Cat ${catIdx + 1}`,
      valores,
    };
  });

  return { categorias: newCategorias, series: newSeries };
}

/**
 * Ordena las categorías según los valores de una serie específica.
 */
export function sortChartDataBySeries(
  block: GraficoDatosBlock,
  serieIndex = 0,
  direction: 'asc' | 'desc' = 'asc',
): {
  categorias: string[];
  series: GraficoSerie[];
} {
  const targetSerie = block.series[serieIndex] ?? block.series[0];
  if (!targetSerie || block.categorias.length <= 1) {
    return { categorias: block.categorias, series: block.series };
  }

  const indices = block.categorias.map((_, idx) => idx);
  indices.sort((a, b) => {
    const valA = targetSerie.valores[a] ?? 0;
    const valB = targetSerie.valores[b] ?? 0;
    return direction === 'asc' ? valA - valB : valB - valA;
  });

  const sortedCategorias = indices.map((i) => block.categorias[i]);
  const sortedSeries = block.series.map((s) => ({
    ...s,
    valores: indices.map((i) => s.valores[i] ?? 0),
    ...(s.cajas ? { cajas: indices.map((i) => s.cajas![i]) } : {}),
  }));

  return { categorias: sortedCategorias, series: sortedSeries };
}
