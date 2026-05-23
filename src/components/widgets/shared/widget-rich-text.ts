/** Utilidades de texto enriquecido para campos de widgets (Tabs/Carousel). */

export function looksLikeRichHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

const ALLOWED_TAGS = new Set(['SPAN', 'B', 'STRONG', 'I', 'EM', 'BR', 'P', 'DIV']);

export function sanitizeWidgetHtml(html: string): string {
  if (typeof document === 'undefined') return html;
  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (node: Node) => {
    const children = [...node.childNodes];
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }
      const el = child as HTMLElement;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
        continue;
      }
      const style = el.getAttribute('style');
      el.removeAttribute('class');
      el.removeAttribute('id');
      [...el.attributes].forEach((attr) => {
        if (attr.name !== 'style') el.removeAttribute(attr.name);
      });
      if (style) {
        const safe = style
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((rule) => {
            const key = rule.split(':')[0]?.trim().toLowerCase() ?? '';
            return (
              key === 'color' ||
              key === 'font-size' ||
              key === 'font-weight' ||
              key === 'font-style' ||
              key === 'text-decoration'
            );
          })
          .join('; ');
        if (safe) el.setAttribute('style', safe);
        else el.removeAttribute('style');
      }
      walk(el);
    }
  };

  walk(template.content);
  return template.innerHTML;
}

export function plainTextToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export function htmlToEditableHtml(value: string): string {
  if (!value) return '';
  if (looksLikeRichHtml(value)) return value;
  return plainTextToHtml(value);
}

export type WidgetTextEditorHandle = {
  el: HTMLElement;
  slideId: string;
  field: string;
  getHtml: () => string;
};

let activeEditor: WidgetTextEditorHandle | null = null;

export function registerWidgetTextEditor(handle: WidgetTextEditorHandle | null) {
  activeEditor = handle;
}

export function getActiveWidgetTextEditor(): WidgetTextEditorHandle | null {
  return activeEditor;
}

export function applyInlineStyleToWidgetSelection(styles: {
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
}): boolean {
  const handle = activeEditor;
  if (!handle) return false;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  if (!handle.el.contains(sel.anchorNode)) return false;

  const range = sel.getRangeAt(0).cloneRange();
  const span = document.createElement('span');
  if (styles.color) span.style.color = styles.color;
  if (styles.fontSize) span.style.fontSize = styles.fontSize;
  if (styles.fontWeight) span.style.fontWeight = styles.fontWeight;
  if (styles.fontStyle) span.style.fontStyle = styles.fontStyle;

  try {
    range.surroundContents(span);
  } catch {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  sel.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  sel.addRange(next);
  handle.el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}
