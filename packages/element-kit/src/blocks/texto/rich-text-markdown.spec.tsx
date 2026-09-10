import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { richTextExtensions } from '@lumina/editor-shared/rich-text/pm-extensions';

function makeEditor() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return new Editor({ element: el, extensions: richTextExtensions(), content: '<p></p>' });
}

// Los input rules de ProseMirror necesitan `handleTextInput`, difícil de simular
// fiablemente en jsdom → el comportamiento visible se cubre en `test:visual`.
// Aquí se verifica el CABLEADO: bold/italic propios (solo `*`), y que el esquema
// representa todo lo que `RichDoc` necesita.
describe('Markdown / esquema del editor (Fase 5A)', () => {
  it('bold/italic propios (star-only) + SmartTypography cableados', () => {
    const editor = makeEditor();
    const names = editor.extensionManager.extensions.map((e) => e.name);
    expect(names).toContain('bold');
    expect(names).toContain('italic');
    expect(names).toContain('luminaSmartTypography');

    // Las reglas de input registradas: bold/italic aportan 1 cada una (solo `*`),
    // no 2 (que incluiría `_`). Se cuenta el total de reglas de las marcas.
    const rules = editor.extensionManager.extensions
      .filter((e) => e.name === 'bold' || e.name === 'italic')
      .flatMap((e) => {
        const fn = e.config.addInputRules as undefined | (() => unknown[]);
        return typeof fn === 'function'
          ? (fn.call({ type: editor.schema.marks[e.name], editor, options: e.options }) ?? [])
          : [];
      });
    expect(rules).toHaveLength(2); // 1 bold (star) + 1 italic (star)
    editor.destroy();
  });

  it('el esquema tiene los nodos y marcas de RichDoc', () => {
    const editor = makeEditor();
    const { nodes, marks } = editor.schema;
    for (const n of ['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'codeBlock', 'taskList', 'taskItem', 'horizontalRule', 'callout', 'table', 'tableRow', 'tableCell', 'tableHeader']) {
      expect(nodes[n], `nodo ${n}`).toBeDefined();
    }
    for (const m of ['bold', 'italic', 'underline', 'strike', 'code', 'textStyle', 'highlight', 'link', 'subscript', 'superscript', 'term', 'spoiler', 'lang']) {
      expect(marks[m], `marca ${m}`).toBeDefined();
    }
    editor.destroy();
  });
});
