import type { TextAlign, TextBlock } from '@lumina/types/slide';
import type { RichDoc, RichNode } from '@lumina/types/rich-text';
import { RICH_NODE_STYLE_KEYS } from '@lumina/types/rich-text';
import { plainToRich, richToPlain, sanitizeRichDoc } from '@lumina/editor-shared/rich-text';

/**
 * Kill-switch de producción del render enriquecido (Fase 1.7). Por defecto ON;
 * `NEXT_PUBLIC_RICH_TEXT=off` (o `0` / `false`) vuelve al render de `contenido`
 * plano. En Fase 1 el camino enriquecido solo se ejercita cuando un bloque ya
 * trae `contenidoRich` (nada lo escribe todavía).
 */
export function isRichTextEnabled(): boolean {
  const flag =
    (typeof process !== 'undefined' && process.env
      ? process.env.NEXT_PUBLIC_RICH_TEXT
      : undefined) ?? '';
  return flag !== 'off' && flag !== '0' && flag !== 'false';
}

/**
 * Accessor único de lectura de un bloque de texto. Devuelve `contenidoRich`
 * saneado si existe, o un `RichDoc` derivado de `contenido` plano usando las
 * pistas del bloque (estructura + tipografía). **Todo render de texto pasa por
 * aquí** — nadie lee `block.contenido` directo para pintar a partir de Fase 1.
 */
export function getRichDoc(block: TextBlock): RichDoc {
  if (isRichTextEnabled() && block.contenidoRich) {
    return sanitizeRichDoc(block.contenidoRich);
  }
  return plainToRich(block.contenido ?? '', {
    nivel: block.nivel,
    lista: block.lista,
    alineacion: block.alineacion,
    fuente: block.fuente,
    tamanoFuente: block.tamanoFuente,
    color: block.color,
    negrita: block.negrita,
    cursiva: block.cursiva,
    subrayado: block.subrayado,
    interlineado: block.interlineado,
    espaciadoLetras: block.espaciadoLetras,
  });
}

/** px → string `"Npx"` para `TextBlock.tamanoFuente`. */
function pxToTamano(px: number): string {
  return `${Math.round(px)}px`;
}

/** ¿Todos los nodos raíz comparten el mismo valor de `key`? Devuelve ese valor o `undefined`. */
function sharedNodeValue<K extends keyof RichNode>(
  nodes: RichNode[],
  key: K,
): RichNode[K] | undefined {
  if (nodes.length === 0) return undefined;
  const first = nodes[0]![key];
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i]![key] !== first) return undefined;
  }
  return first;
}

/**
 * Aplica un `RichDoc` editado a un `TextBlock`: guarda `contenidoRich`, recomputa
 * `contenido` plano y **deriva las propiedades de bloque** (`nivel`, `lista`,
 * `alineacion` + tipografía: `tamanoFuente`, `color`, `fuente`, `negrita`,
 * `cursiva`, `subrayado`, `interlineado`, `espaciadoLetras`) del/los nodo(s)
 * raíz. Así el panel de propiedades y la escala no divergen del documento.
 *
 * - Funciona con docs de varios nodos si **todos** comparten el mismo valor;
 *   si divergen, esa propiedad de bloque se deja como está (estado "mixto").
 * - Nunca borra `nivel` si el primer nodo sigue siendo `heading` (aunque esté
 *   vacío) — vaciar un título ya no lo degradaba a párrafo.
 */
export function syncTextBlockFromRichDoc(block: TextBlock, doc: RichDoc): TextBlock {
  const next: TextBlock = { ...block, contenidoRich: doc, contenido: richToPlain(doc) };
  const nodes = doc.nodes;
  if (nodes.length === 0) return next;
  const first = nodes[0]!;
  const single = nodes.length === 1;

  // ── Estructura (solo docs de un nodo — `nivel`/`lista` no "acuerdan" entre
  //    un encabezado y un párrafo; en multi-nodo el panel deriva por cursor). ──
  if (single) {
    if (first.type === 'heading') next.nivel = first.level ?? 2;
    else delete next.nivel;

    if (first.type === 'bulletList') next.lista = 'vinetas';
    else if (first.type === 'orderedList') next.lista = 'numeros';
    else delete next.lista;
  }

  // ── Alineación y tipografía: se comparten si TODOS los nodos coinciden. ────
  const align = sharedNodeValue(nodes, 'align');
  if (align) next.alineacion = align as TextAlign;
  else if (nodes.every((n) => !n.align)) delete next.alineacion;

  // ── Tipografía del bloque ─────────────────────────────────────────────────
  const applyStyle = <T>(
    key: (typeof RICH_NODE_STYLE_KEYS)[number],
    onValue: (v: T) => void,
    onClear: () => void,
  ) => {
    const shared = sharedNodeValue(nodes, key as keyof RichNode) as T | undefined;
    if (shared !== undefined && shared !== null) onValue(shared);
    else if (
      nodes.every(
        (n) => (n as unknown as Record<string, unknown>)[key] === undefined,
      )
    )
      onClear();
  };

  applyStyle<string>('fontFamily', (v) => (next.fuente = v), () => delete next.fuente);
  applyStyle<number>(
    'fontSize',
    (v) => (next.tamanoFuente = pxToTamano(v)),
    () => delete next.tamanoFuente,
  );
  applyStyle<string>('color', (v) => (next.color = v), () => delete next.color);
  applyStyle<boolean>('bold', (v) => (next.negrita = v), () => delete next.negrita);
  applyStyle<boolean>('italic', (v) => (next.cursiva = v), () => delete next.cursiva);
  applyStyle<boolean>(
    'underline',
    (v) => (next.subrayado = v),
    () => delete next.subrayado,
  );
  applyStyle<number>(
    'lineHeight',
    (v) => (next.interlineado = v),
    () => delete next.interlineado,
  );
  applyStyle<number>(
    'letterSpacing',
    (v) => (next.espaciadoLetras = v),
    () => delete next.espaciadoLetras,
  );

  return next;
}
