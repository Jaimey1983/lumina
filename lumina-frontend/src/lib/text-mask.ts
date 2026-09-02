/**
 * Máscaras de recorte basadas en texto vectorizado.
 *
 * El usuario escribe un texto y elige fuente + peso; ese texto se convierte en un
 * `path` SVG (contorno real de cada glifo, extraído del binario de la fuente con
 * `opentype.js`) que se usa como `clipPath`, igual que las máscaras predefinidas
 * y `libre`.
 *
 * Fidelidad de curva (criterio de aceptación): el contorno se construye
 * **comando a comando** desde `path.commands` de opentype.js. Cada `Q`/`C` del
 * glifo se emite como `Q`/`C` en el `d` resultante — nunca se aplana (`flatten`)
 * ni se muestrea la curva en puntos. El único cambio es una transformación afín
 * (escala + traslación) para llevar el contorno a coords `objectBoundingBox`
 * (0–1), que es lo que consume `generarClipPath` / el render de `clip-group`.
 *
 * `opentype.js` se carga con `import()` dinámico: solo entra al bundle cuando se
 * genera o regenera una máscara de texto, no en el bundle principal del editor.
 */

import type { Font, Path, PathCommand } from 'opentype.js';

import { resolveFontFamily, weightsForFamily } from '@/lib/font-catalog';
import type { ClipShapeTexto } from '@/types/slide.types';

/** Límite de caracteres por línea del texto de una máscara. */
export const TEXT_MASK_MAX_CHARS = 40;

/** Límite de líneas (multilínea con interlineado ajustable). */
export const TEXT_MASK_MAX_LINES = 6;

/** Peso por defecto de una máscara de texto nueva. */
export const TEXT_MASK_DEFAULT_WEIGHT = 400;

/** unidades del contorno intermedio; se cancelan al normalizar por el bbox. */
const OUTLINE_UNITS = 1000;

/** decimales del `d` normalizado (0–1): 5 basta para curvas suaves a cualquier zoom. */
const DECIMALS = 5;

function round(n: number): number {
  const f = 10 ** DECIMALS;
  return Math.round(n * f) / f;
}

/**
 * Pesos disponibles para una familia en una máscara de texto. Reutiliza el
 * catálogo de Google Fonts de la plataforma; las familias de sistema (sin
 * binario descargable) devuelven lista vacía y no admiten máscara de texto.
 */
export function weightsForTextMask(family: string): number[] {
  return weightsForFamily(resolveFontFamily(family));
}

export function familySupportsTextMask(family: string): boolean {
  return weightsForTextMask(family).length > 0;
}

/** id de Fontsource: familia en minúsculas con espacios → guiones (`Plus Jakarta Sans` → `plus-jakarta-sans`). */
export function fontsourceSlug(family: string): string {
  return resolveFontFamily(family)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * URL del binario `.ttf` de la familia + peso.
 *
 * Google Fonts (`css2`) sirve `woff2` a los navegadores modernos y `opentype.js`
 * no descomprime Brotli, así que no sirve para `opentype.parse()`. Fontsource
 * publica exactamente las mismas familias de Google como `.ttf` sin comprimir en
 * el CDN de jsDelivr — mismo diseño de glifo, formato que opentype.js sí parsea.
 */
export function fontsourceTtfUrl(family: string, weight: number): string {
  const slug = fontsourceSlug(family);
  return `https://cdn.jsdelivr.net/fontsource/fonts/${slug}@latest/latin-${weight}-normal.ttf`;
}

/** Cache en memoria de la sesión: familia+peso → `Font` ya parseada (o su promesa). */
const fontCache = new Map<string, Promise<Font>>();

async function fetchFont(family: string, weight: number): Promise<Font> {
  const [{ parse }, res] = await Promise.all([
    import('opentype.js'),
    fetch(fontsourceTtfUrl(family, weight)),
  ]);
  if (!res.ok) {
    const err = new Error(`FONT_FETCH_${res.status}`);
    err.name = 'TextMaskFontError';
    throw err;
  }
  const buffer = await res.arrayBuffer();
  return parse(buffer);
}

/**
 * Descarga (una vez) y parsea la fuente para `family` + `weight`. Si el peso
 * exacto no existe en Fontsource, cae a 400. Cachea por familia+peso durante la
 * sesión: cambiar solo el texto no vuelve a descargar ni re-parsear.
 */
export async function loadTextMaskFont(
  family: string,
  weight: number = TEXT_MASK_DEFAULT_WEIGHT,
): Promise<Font> {
  const resolved = resolveFontFamily(family);
  const available = weightsForTextMask(resolved);
  if (available.length === 0) {
    const err = new Error('FONT_NOT_SUPPORTED');
    err.name = 'TextMaskFontError';
    throw err;
  }
  const effectiveWeight = available.includes(weight) ? weight : available[0]!;
  const key = `${fontsourceSlug(resolved)}@${effectiveWeight}`;

  let promise = fontCache.get(key);
  if (!promise) {
    // Si Fontsource no tiene ese peso exacto, caemos a 400. El resultado se
    // cachea bajo la clave del peso pedido (mejor una fuente de peso vecino que
    // fallar); `ClipShapeTexto.fontWeight` conserva el peso solicitado.
    promise = fetchFont(resolved, effectiveWeight).catch((firstErr) => {
      if (effectiveWeight !== 400) return fetchFont(resolved, 400);
      throw firstErr;
    });
    fontCache.set(key, promise);
    // No dejar una promesa rechazada cacheada: el siguiente intento reintenta.
    promise.catch(() => fontCache.delete(key));
  }
  return promise;
}

/**
 * Convierte los comandos del contorno de opentype.js a un `d` de `<path>` en
 * coords `objectBoundingBox` (0–1), preservando cada `Q`/`C` original.
 *
 * `bbox` es la caja envolvente del contorno (la calcula `commandsBBox`, que
 * incluye los puntos de control). La transformación base es `n = (v - min) /
 * size` en cada eje: afín, sin remuestreo.
 *
 * `fill` escala el contorno respecto al centro del recuadro (control "Tamaño de
 * letra"): 0 = colapsa a un punto (máscara vacía), 1 = llena el recuadro, >1 =
 * sobresale y el recuadro del bloque lo recorta.
 */
export function commandsToObjectBoundingBoxD(
  commands: readonly PathCommand[],
  bbox: { x1: number; y1: number; x2: number; y2: number },
  fill = 1,
): string {
  const w = bbox.x2 - bbox.x1;
  const h = bbox.y2 - bbox.y1;
  if (!(w > 0) || !(h > 0)) return '';
  const f = Number.isFinite(fill) && fill >= 0 ? fill : 1;
  const nx = (v: number) => round(0.5 + ((v - bbox.x1) / w - 0.5) * f);
  const ny = (v: number) => round(0.5 + ((v - bbox.y1) / h - 0.5) * f);

  const parts: string[] = [];
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        parts.push(`M${nx(cmd.x)},${ny(cmd.y)}`);
        break;
      case 'L':
        parts.push(`L${nx(cmd.x)},${ny(cmd.y)}`);
        break;
      case 'Q':
        parts.push(`Q${nx(cmd.x1)},${ny(cmd.y1)} ${nx(cmd.x)},${ny(cmd.y)}`);
        break;
      case 'C':
        parts.push(
          `C${nx(cmd.x1)},${ny(cmd.y1)} ${nx(cmd.x2)},${ny(cmd.y2)} ${nx(cmd.x)},${ny(cmd.y)}`,
        );
        break;
      case 'Z':
        parts.push('Z');
        break;
    }
  }
  return parts.join(' ');
}

// ─── Tipografía ajustable ────────────────────────────────────────────────────

export type TextMaskAlign = 'left' | 'center' | 'right';

/** Controles tipográficos del panel. Todos con un valor neutro por defecto. */
export interface TextMaskTypography {
  /**
   * Tamaño de letra: escala del contorno respecto al recuadro de la máscara.
   * 0 = invisible; 1 = las letras tocan los bordes; >1 = el texto sobresale y
   * el propio recuadro del bloque lo recorta (efecto "zoom").
   */
  fontScale: number;
  /** Espaciado entre letras (tracking) en em. 0 = natural de la fuente. */
  letterSpacing: number;
  /** Interlineado como múltiplo de la altura de línea de la fuente. 1 = natural. */
  lineHeight: number;
  /** Ancho de letra: escala horizontal relativa del glifo. 1 = natural. */
  scaleX: number;
  /** Alto de letra: escala vertical relativa del glifo. 1 = natural. */
  scaleY: number;
  /** Alineación de las líneas (solo visible con texto multilínea). */
  align: TextMaskAlign;
}

export const DEFAULT_TYPOGRAPHY: TextMaskTypography = {
  fontScale: 1,
  letterSpacing: 0,
  lineHeight: 1,
  scaleX: 1,
  scaleY: 1,
  align: 'center',
};

export const TYPOGRAPHY_LIMITS = {
  fontScale: { min: 0, max: 3, step: 0.05 },
  letterSpacing: { min: -0.15, max: 0.6, step: 0.01 },
  lineHeight: { min: 0.7, max: 2.5, step: 0.05 },
  scaleX: { min: 0.4, max: 2.5, step: 0.05 },
  scaleY: { min: 0.4, max: 2.5, step: 0.05 },
} as const;

function clampRange(n: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Sanea un objeto tipografía parcial (de JSON o de props). */
export function normalizeTypography(input?: Partial<TextMaskTypography> | null): TextMaskTypography {
  const t = input ?? {};
  const L = TYPOGRAPHY_LIMITS;
  return {
    fontScale: clampRange(Number(t.fontScale), L.fontScale.min, L.fontScale.max, 1),
    letterSpacing: clampRange(Number(t.letterSpacing), L.letterSpacing.min, L.letterSpacing.max, 0),
    lineHeight: clampRange(Number(t.lineHeight), L.lineHeight.min, L.lineHeight.max, 1),
    scaleX: clampRange(Number(t.scaleX), L.scaleX.min, L.scaleX.max, 1),
    scaleY: clampRange(Number(t.scaleY), L.scaleY.min, L.scaleY.max, 1),
    align: t.align === 'left' || t.align === 'right' ? t.align : 'center',
  };
}

// ─── Composición del contorno ────────────────────────────────────────────────

function mapCommand(
  cmd: PathCommand,
  fn: (x: number, y: number) => [number, number],
): PathCommand {
  switch (cmd.type) {
    case 'M': {
      const [x, y] = fn(cmd.x, cmd.y);
      return { type: 'M', x, y };
    }
    case 'L': {
      const [x, y] = fn(cmd.x, cmd.y);
      return { type: 'L', x, y };
    }
    case 'Q': {
      const [x1, y1] = fn(cmd.x1, cmd.y1);
      const [x, y] = fn(cmd.x, cmd.y);
      return { type: 'Q', x1, y1, x, y };
    }
    case 'C': {
      const [x1, y1] = fn(cmd.x1, cmd.y1);
      const [x2, y2] = fn(cmd.x2, cmd.y2);
      const [x, y] = fn(cmd.x, cmd.y);
      return { type: 'C', x1, y1, x2, y2, x, y };
    }
    default:
      return { type: 'Z' };
  }
}

/** Caja envolvente (incluye puntos de control: cota holgada, garantiza que nada se recorta). */
function commandsBBox(
  commands: readonly PathCommand[],
): { x1: number; y1: number; x2: number; y2: number } {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  const add = (x: number, y: number) => {
    if (x < x1) x1 = x;
    if (y < y1) y1 = y;
    if (x > x2) x2 = x;
    if (y > y2) y2 = y;
  };
  for (const c of commands) {
    if (c.type === 'Z') continue;
    if (c.type === 'Q' || c.type === 'C') add(c.x1, c.y1);
    if (c.type === 'C') add(c.x2, c.y2);
    add(c.x, c.y);
  }
  return { x1, y1, x2, y2 };
}

/**
 * Divide el texto en las líneas efectivas de una máscara: recorta a
 * `TEXT_MASK_MAX_LINES` líneas y `TEXT_MASK_MAX_CHARS` caracteres por línea.
 * Fuente única para la geometría y para lo que se persiste.
 */
export function splitMaskLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .slice(0, TEXT_MASK_MAX_LINES)
    .map((line) => line.slice(0, TEXT_MASK_MAX_CHARS));
}

export interface TextMaskGeometry {
  /** `d` en coords 0–1, curvas Bézier preservadas. */
  pathData: string;
  /** relación ancho/alto del contorno (para dimensionar el bloque sin distorsión). */
  aspect: number;
}

/**
 * Compone el contorno de `text` (una o varias líneas) aplicando la tipografía y
 * devuelve el `d` normalizado a 0–1 más el `aspect`. Cada glifo se coloca por
 * su advance real; nada se aplana ni se muestrea.
 */
export function textOutlineGeometry(
  font: Font,
  text: string,
  typography?: Partial<TextMaskTypography> | null,
): TextMaskGeometry | null {
  const typo = normalizeTypography(typography);

  const lines = splitMaskLines(text);
  if (!lines.some((line) => line.trim())) return null;

  const lineStep =
    ((font.ascender - font.descender) / font.unitsPerEm) * OUTLINE_UNITS * typo.lineHeight;
  const opts = { kerning: true, letterSpacing: typo.letterSpacing };

  // 1er pase: path + ancho por línea (para alinear).
  const perLine = lines.map((line, i) => {
    if (!line.trim()) return { commands: [] as PathCommand[], width: 0 };
    const path: Path = font.getPath(line, 0, i * lineStep, OUTLINE_UNITS, opts);
    const width = font.getAdvanceWidth(line, OUTLINE_UNITS, opts);
    return { commands: path.commands, width };
  });
  const maxWidth = Math.max(0, ...perLine.map((l) => l.width));

  // 2º pase: desplazamiento horizontal por alineación + escala no uniforme.
  const sx = typo.scaleX;
  const sy = typo.scaleY;
  const commands: PathCommand[] = [];
  for (const { commands: lineCommands, width } of perLine) {
    if (!lineCommands.length) continue;
    const dx =
      typo.align === 'right'
        ? maxWidth - width
        : typo.align === 'center'
          ? (maxWidth - width) / 2
          : 0;
    for (const cmd of lineCommands) {
      commands.push(mapCommand(cmd, (x, y) => [(x + dx) * sx, y * sy]));
    }
  }
  if (!commands.length) return null;

  const bbox = commandsBBox(commands);
  const w = bbox.x2 - bbox.x1;
  const h = bbox.y2 - bbox.y1;
  if (!(w > 0) || !(h > 0)) return null;

  const pathData = commandsToObjectBoundingBoxD(commands, bbox, typo.fontScale);
  if (!pathData) return null;

  // `aspect` = proporción del recuadro completo (no cambia con `fontScale`: el
  // margen de "Tamaño de letra" queda dentro del bloque, no lo redimensiona).
  return { pathData, aspect: w / h };
}

export interface BuildTextClipShapeInput {
  text: string;
  fontFamily: string;
  fontWeight: number;
  typography?: Partial<TextMaskTypography> | null;
}

/**
 * Descarga la fuente si hace falta y genera el `ClipShapeTexto` completo
 * (`pathData` ya normalizado, listo para persistir). Lanza `TextMaskFontError`
 * si la fuente no se puede obtener y `Error('EMPTY_OUTLINE')` si el texto no
 * genera contorno.
 */
export async function buildTextClipShape({
  text,
  fontFamily,
  fontWeight,
  typography,
}: BuildTextClipShapeInput): Promise<ClipShapeTexto> {
  const family = resolveFontFamily(fontFamily);
  const font = await loadTextMaskFont(family, fontWeight);
  const typo = normalizeTypography(typography);
  const geometry = textOutlineGeometry(font, text, typo);
  if (!geometry) {
    const err = new Error('EMPTY_OUTLINE');
    err.name = 'TextMaskError';
    throw err;
  }
  return {
    tipo: 'texto',
    text: splitMaskLines(text).join('\n'),
    fontFamily: family,
    fontWeight,
    pathData: geometry.pathData,
    fillRule: 'nonzero',
    aspect: round(geometry.aspect),
    fontScale: typo.fontScale,
    letterSpacing: typo.letterSpacing,
    lineHeight: typo.lineHeight,
    scaleX: typo.scaleX,
    scaleY: typo.scaleY,
    align: typo.align,
  };
}
