'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { RichDoc } from '@lumina/types/rich-text';
import { richTextExtensions } from './pm-extensions.js';
import { richToPmDoc, pmDocToRich, type PmJSON } from './pm-serializers.js';
import { registerActiveRichEditor } from './active-editor.js';
import { BubbleToolbar } from './bubble-toolbar.js';
import { HEADING_SCALE } from '../heading-scale.js';

const STYLE_ID = 'lumina-rich-editor-styles';
// Escala H1–H6 como *fallback* del editor (Tailwind resetea `h1..h6`). El estilo
// por nodo (Fase 1) llega como `style` inline y siempre gana sobre estas reglas
// → editar se ve igual que el render.
const HEADING_CSS = ([1, 2, 3, 4, 5, 6] as const)
  .map((n) => {
    const s = HEADING_SCALE[n];
    return `.lumina-rich-editor h${n}{font-size:${s.sizePx}px;font-weight:${s.weight};line-height:${s.lineHeight};letter-spacing:${s.trackingPx}px;margin:0}`;
  })
  .join('\n');
const EDITOR_CSS = `
.lumina-rich-editor{outline:none;white-space:pre-wrap;word-break:break-word;height:100%;width:100%;overflow-y:auto;box-sizing:border-box;padding:2px}
.lumina-rich-editor:focus,.lumina-rich-editor:focus-visible{outline:none}
.lumina-rich-editor p{margin:0}
${HEADING_CSS}
.lumina-rich-editor ul,.lumina-rich-editor ol{margin:0;padding-left:1.2em}
.lumina-rich-editor blockquote{margin:0;padding-left:0.8em;border-left:3px solid rgba(15,23,42,.15)}
.lumina-rich-editor pre{margin:0}
.lumina-rich-editor [data-spoiler]{background:currentColor;border-radius:3px}
.lumina-rich-editor p.is-editor-empty:first-child::before{content:attr(data-placeholder);float:left;color:var(--muted-foreground,#a1a1aa);pointer-events:none;height:0}
`;

function ensureEditorStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = EDITOR_CSS;
  document.head.appendChild(el);
}

export interface RichTextEditorProps {
  /** Documento inicial. Sólo se lee al montar; el editor es no controlado. */
  value: RichDoc;
  /** Un único commit por gesto de edición (blur / Shift+Enter). */
  onCommit: (doc: RichDoc) => void;
  onDiscard?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  ownerId?: string;
  className?: string;
  style?: CSSProperties;
  /** Oculta la barra flotante de formato (por defecto se muestra). */
  hideToolbar?: boolean;
}

export function RichTextEditor({
  value,
  onCommit,
  onDiscard,
  autoFocus = true,
  placeholder,
  ownerId = 'texto',
  className,
  style,
  hideToolbar = false,
}: RichTextEditorProps) {
  ensureEditorStyles();
  const exitedRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const onDiscardRef = useRef(onDiscard);
  onDiscardRef.current = onDiscard;
  const initialContent = useRef<PmJSON>(richToPmDoc(value)).current;

  const editor = useEditor({
    extensions: richTextExtensions({ placeholder }),
    content: initialContent,
    autofocus: autoFocus ? 'end' : false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'lumina-rich-editor',
        lang: 'es',
        spellcheck: 'true',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
  });

  function commit(): void {
    if (!editor || editor.isDestroyed || exitedRef.current) return;
    if (editor.view.composing) return; // IME: no comitear a mitad de composición
    exitedRef.current = true;
    registerActiveRichEditor(null);
    onCommitRef.current(pmDocToRich(editor.getJSON() as PmJSON));
  }

  function discard(): void {
    if (exitedRef.current) return;
    exitedRef.current = true;
    registerActiveRichEditor(null);
    onDiscardRef.current?.();
  }

  useEffect(() => {
    if (!editor) return;
    exitedRef.current = false;
    const handleFocus = () => registerActiveRichEditor({ editor, ownerId });
    const handleBlur = ({ event }: { event: FocusEvent }) => {
      // Solo se comitea si el foco aterriza en un elemento REAL fuera del editor
      // y fuera de la zona segura (panel / barra flotante). Un `blur` con
      // `relatedTarget` nulo (arrastre de selección fuera de la caja, foco que
      // sale de la ventana, re-render del árbol) NO cierra la edición — antes
      // cualquier blur transitorio expulsaba al usuario a media selección.
      const next = (event?.relatedTarget ?? null) as HTMLElement | null;
      if (!next) return;
      if (editor.view.dom.contains(next)) return;
      if (typeof next.closest === 'function' && next.closest('[data-rich-text-safe]')) return;
      commit();
    };
    editor.on('focus', handleFocus);
    editor.on('blur', handleBlur);
    if (editor.isFocused) registerActiveRichEditor({ editor, ownerId });

    const dom = editor.view.dom;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        discard();
        editor.commands.blur();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        commit(); // directo — no depender de que el `blur` dispare síncrono
        editor.commands.blur();
      }
    };
    dom.addEventListener('keydown', onKeyDown);

    return () => {
      editor.off('focus', handleFocus);
      editor.off('blur', handleBlur);
      dom.removeEventListener('keydown', onKeyDown);
      // Al desmontar (cambio de slide / bloque / `editingId`) se conserva la
      // edición: es la señal canónica de "el usuario terminó". `commit()` está
      // protegido contra doble ejecución (`exitedRef`) y editor destruido.
      commit();
      registerActiveRichEditor(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <>
      <EditorContent editor={editor} className={className} style={style} />
      {!hideToolbar ? <BubbleToolbar editor={editor} /> : null}
    </>
  );
}
