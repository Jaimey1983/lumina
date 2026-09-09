/**
 * Saneado de HTML para los campos de texto de widgets (Tabs/Carousel/…), que se
 * persisten como `string` y pueden contener HTML enriquecido pegado o legado.
 *
 * Antes vivía en `widget-rich-text.ts` junto a un editor de rango por
 * `contentEditable` que **nunca se llegó a cablear** (código muerto, retirado en
 * Fase 3). El editor enriquecido real es `<RichTextEditor>` (Fase 2).
 */

import { isSafeHref } from './sanitize.js';

export function looksLikeRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

const ALLOWED_TAGS = new Set([
  'SPAN',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'MARK',
  'SUP',
  'SUB',
  'BR',
  'P',
  'DIV',
  'A',
]);

const ALLOWED_STYLE = new Set([
  'color',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
  'background-color',
  'letter-spacing',
]);

/** Limpia un string HTML para `dangerouslySetInnerHTML`: allowlist de etiquetas,
 * de propiedades CSS inline y de `href` (vía `isSafeHref`). */
export function sanitizeWidgetHtml(html: string): string {
  if (typeof document === 'undefined') return html;
  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (node: Node): void => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }
      const el = child as HTMLElement;
      // Post-orden: sanea los hijos antes de decidir sobre `el`, así al
      // desenrollar una etiqueta no permitida su contenido ya está limpio.
      walk(el);
      if (!ALLOWED_TAGS.has(el.tagName)) {
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
        continue;
      }

      const style = el.getAttribute('style');
      const href = el.tagName === 'A' ? el.getAttribute('href') : null;
      for (const attr of [...el.attributes]) el.removeAttribute(attr.name);

      if (el.tagName === 'A') {
        if (href && isSafeHref(href)) {
          el.setAttribute('href', href);
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        } else {
          const parent = el.parentNode;
          while (el.firstChild) parent?.insertBefore(el.firstChild, el);
          parent?.removeChild(el);
          continue;
        }
      }

      if (style) {
        const safe = style
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((rule) => ALLOWED_STYLE.has(rule.split(':')[0]?.trim().toLowerCase() ?? ''))
          .join('; ');
        if (safe) el.setAttribute('style', safe);
      }
    }
  };

  walk(template.content);
  return template.innerHTML;
}
