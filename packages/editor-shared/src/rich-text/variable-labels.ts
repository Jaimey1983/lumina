/**
 * N4 — en el editor, `{{var:<id>}}` se muestra como una etiqueta con el NOMBRE
 * de la variable (D17). El documento sigue guardando el token por id; esto es
 * solo presentación (decoración de ProseMirror, no cambia el esquema).
 */
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PmNode } from '@tiptap/pm/model';
import type { VariableDef } from '@lumina/types/interaction';

let nombres: ReadonlyMap<string, string> = new Map();

/** El editor de la clase publica aquí los nombres vigentes de sus variables. */
export function setVariableLabels(defs: readonly VariableDef[] | undefined): void {
  nombres = new Map((defs ?? []).map((d) => [d.id, d.nombre]));
}

const TOKEN_VAR = /\{\{\s*var:([\w.-]+)\s*\}\}/g;

export function decoracionesDeVariables(doc: PmNode): DecorationSet {
  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    for (const m of node.text.matchAll(TOKEN_VAR)) {
      const id = m[1] ?? '';
      const from = pos + (m.index ?? 0);
      const to = from + m[0].length;
      const nombre = nombres.get(id);
      decos.push(Decoration.inline(from, to, { style: 'display:none' }));
      decos.push(
        Decoration.widget(
          from,
          () => {
            const el = document.createElement('span');
            el.textContent = nombre ?? 'variable eliminada';
            el.setAttribute('data-variable-etiqueta', id);
            el.setAttribute('contenteditable', 'false');
            el.style.cssText =
              'background:' +
              (nombre ? 'rgba(37,99,235,0.14)' : 'rgba(220,38,38,0.14)') +
              ';color:' +
              (nombre ? '#1d4ed8' : '#b91c1c') +
              ';border-radius:4px;padding:0 4px;font-size:0.9em;white-space:nowrap';
            return el;
          },
          { side: -1, key: `var:${id}:${nombre ?? ''}:${from}` },
        ),
      );
    }
  });
  return DecorationSet.create(doc, decos);
}

const key = new PluginKey('luminaVariableLabels');

export const VariableLabels = Extension.create({
  name: 'variableLabels',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        state: {
          init: (_c, { doc }) => decoracionesDeVariables(doc),
          apply: (tr, old) => (tr.docChanged ? decoracionesDeVariables(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return key.getState(state);
          },
        },
      }),
    ];
  },
});
