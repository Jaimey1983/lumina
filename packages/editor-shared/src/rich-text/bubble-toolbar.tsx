'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  BookMarked,
  Code,
  EyeOff,
  Highlighter,
  Indent,
  Info,
  Italic,
  SquareCode,
  Link2,
  Link2Off,
  ListChecks,
  Minus,
  Outdent,
  Sigma,
  Table as TableIcon,
  Plus,
  Presentation,
  RemoveFormatting,
  Sparkles,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Underline,
} from 'lucide-react';
import { isSafeHref } from './sanitize.js';
import { useRichTextAi } from './ai-context.js';
import { AiAssistPanel } from './ai-assist-panel.js';

const SIZE_STEP = 2;
const SIZE_MIN = 8;
const SIZE_MAX = 400;
const HIGHLIGHT_DEFAULT = '#FEF3C7';

function currentFontSizePx(editor: Editor): number {
  const raw = editor.getAttributes('textStyle').fontSize as string | undefined;
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) ? n : 16;
}

function setFontSize(editor: Editor, px: number): void {
  const clamped = Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(px)));
  editor.chain().focus().setMark('textStyle', { fontSize: `${clamped}px` }).run();
}

const INDENT_STEP = 1.5;
const INDENT_MAX = 9;

/** Tipo del nodo de bloque que contiene la selección (paragraph / heading). */
function currentBlockType(editor: Editor): 'paragraph' | 'heading' | null {
  const name = editor.state.selection.$from.parent.type.name;
  return name === 'paragraph' || name === 'heading' ? name : null;
}

function changeIndent(editor: Editor, delta: number): void {
  const type = currentBlockType(editor);
  if (!type) return;
  const cur = (editor.getAttributes(type).indent as number | undefined) ?? 0;
  const next = Math.max(0, Math.min(INDENT_MAX, cur + delta));
  editor
    .chain()
    .focus()
    .updateAttributes(type, { indent: next === 0 ? null : next })
    .run();
}

interface ToolbarButton {
  id: string;
  label: string;
  icon: ReactNode;
  isActive?: (e: Editor) => boolean;
  isDisabled?: (e: Editor) => boolean;
  run: (e: Editor) => void;
}

function buildButtons(onAiAssist?: () => void): ToolbarButton[] {
  const btns: ToolbarButton[] = [
    { id: 'bold', label: 'Negrita', icon: <Bold className="size-3.5" />, isActive: (e) => e.isActive('bold'), run: (e) => e.chain().focus().toggleBold().run() },
    { id: 'italic', label: 'Cursiva', icon: <Italic className="size-3.5" />, isActive: (e) => e.isActive('italic'), run: (e) => e.chain().focus().toggleItalic().run() },
    { id: 'underline', label: 'Subrayado', icon: <Underline className="size-3.5" />, isActive: (e) => e.isActive('underline'), run: (e) => e.chain().focus().toggleUnderline().run() },
    { id: 'strike', label: 'Tachado', icon: <Strikethrough className="size-3.5" />, isActive: (e) => e.isActive('strike'), run: (e) => e.chain().focus().toggleStrike().run() },
    { id: 'code', label: 'Código', icon: <Code className="size-3.5" />, isActive: (e) => e.isActive('code'), run: (e) => e.chain().focus().toggleCode().run() },
    { id: 'sup', label: 'Superíndice', icon: <SupIcon className="size-3.5" />, isActive: (e) => e.isActive('superscript'), run: (e) => e.chain().focus().toggleSuperscript().run() },
    { id: 'sub', label: 'Subíndice', icon: <SubIcon className="size-3.5" />, isActive: (e) => e.isActive('subscript'), run: (e) => e.chain().focus().toggleSubscript().run() },
    { id: 'highlight', label: 'Resaltar', icon: <Highlighter className="size-3.5" />, isActive: (e) => e.isActive('highlight'), run: (e) => e.chain().focus().toggleHighlight({ color: HIGHLIGHT_DEFAULT }).run() },
    { id: 'spoiler', label: 'Ocultar respuesta', icon: <EyeOff className="size-3.5" />, isActive: (e) => e.isActive('spoiler'), run: (e) => e.chain().focus().toggleMark('spoiler').run() },
    { id: 'size-down', label: 'Reducir tamaño', icon: <Minus className="size-3.5" />, run: (e) => setFontSize(e, currentFontSizePx(e) - SIZE_STEP) },
    { id: 'size-up', label: 'Aumentar tamaño', icon: <Plus className="size-3.5" />, run: (e) => setFontSize(e, currentFontSizePx(e) + SIZE_STEP) },
    {
      id: 'link',
      label: 'Enlace',
      icon: <Link2 className="size-3.5" />,
      isActive: (e) => e.isActive('link'),
      run: (e) => {
        const prev = (e.getAttributes('link').href as string | undefined) ?? '';
        const url = typeof window !== 'undefined' ? window.prompt('URL del enlace', prev) : null;
        if (url === null) return;
        const href = url.trim();
        if (href === '') {
          e.chain().focus().unsetLink().run();
        } else if (isSafeHref(href)) {
          e.chain().focus().extendMarkRange('link').setLink({ href }).run();
        }
      },
    },
    {
      id: 'slide-ref',
      label: 'Ir a diapositiva',
      icon: <Presentation className="size-3.5" />,
      isActive: (e) => typeof e.getAttributes('link').slideRef === 'number',
      run: (e) => {
        const prev = e.getAttributes('link').slideRef as number | undefined;
        const raw =
          typeof window !== 'undefined'
            ? window.prompt('Número de diapositiva', prev ? String(prev) : '')
            : null;
        if (raw === null) return;
        const n = Math.round(Number(raw.trim()));
        if (!Number.isFinite(n) || n < 1) {
          e.chain().focus().unsetLink().run();
          return;
        }
        e.chain().focus().extendMarkRange('link').setMark('link', { href: null, slideRef: n }).run();
      },
    },
    { id: 'unlink', label: 'Quitar enlace', icon: <Link2Off className="size-3.5" />, isDisabled: (e) => !e.isActive('link'), run: (e) => e.chain().focus().unsetLink().run() },
    {
      id: 'term',
      label: 'Término del glosario',
      icon: <BookMarked className="size-3.5" />,
      isActive: (e) => e.isActive('term'),
      run: (e) => {
        if (e.isActive('term')) {
          e.chain().focus().unsetMark('term').run();
          return;
        }
        const prev = (e.getAttributes('term').definicion as string | undefined) ?? '';
        const def =
          typeof window !== 'undefined' ? window.prompt('Definición del término', prev) : null;
        if (def === null) return;
        const definicion = def.trim();
        const glosaId =
          (e.getAttributes('term').glosaId as string | undefined) ??
          `t-${Math.random().toString(36).slice(2, 9)}`;
        e
          .chain()
          .focus()
          .setMark('term', { glosaId, definicion: definicion === '' ? null : definicion })
          .run();
      },
    },
    {
      id: 'outdent',
      label: 'Reducir sangría',
      icon: <Outdent className="size-3.5" />,
      isDisabled: (e) => !currentBlockType(e) || !(e.getAttributes(currentBlockType(e)!).indent),
      run: (e) => changeIndent(e, -INDENT_STEP),
    },
    {
      id: 'indent',
      label: 'Aumentar sangría',
      icon: <Indent className="size-3.5" />,
      isDisabled: (e) => !currentBlockType(e),
      run: (e) => changeIndent(e, INDENT_STEP),
    },
    {
      id: 'task-list',
      label: 'Lista de tareas',
      icon: <ListChecks className="size-3.5" />,
      isActive: (e) => e.isActive('taskList'),
      run: (e) => e.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'callout',
      label: 'Llamada (nota)',
      icon: <Info className="size-3.5" />,
      isActive: (e) => e.isActive('callout'),
      run: (e) =>
        e.isActive('callout')
          ? e.chain().focus().setNode('paragraph').run()
          : e.chain().focus().setNode('callout', { variant: 'nota' }).run(),
    },
    {
      id: 'table',
      label: 'Insertar / quitar tabla',
      icon: <TableIcon className="size-3.5" />,
      isActive: (e) => e.isActive('table'),
      run: (e) =>
        e.isActive('table')
          ? e.chain().focus().deleteTable().run()
          : e
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
    },
    {
      id: 'code-block',
      label: 'Bloque de código',
      icon: <SquareCode className="size-3.5" />,
      isActive: (e) => e.isActive('codeBlock'),
      run: (e) => {
        if (e.isActive('codeBlock')) {
          e.chain().focus().toggleCodeBlock().run();
          return;
        }
        const lang =
          typeof window !== 'undefined'
            ? window.prompt('Lenguaje (opcional): js, python, sql…', '')
            : null;
        const chain = e.chain().focus();
        (lang && lang.trim()
          ? chain.toggleCodeBlock({ language: lang.trim() })
          : chain.toggleCodeBlock()
        ).run();
      },
    },
    {
      id: 'math',
      label: 'Fórmula (LaTeX)',
      icon: <Sigma className="size-3.5" />,
      isActive: (e) => e.isActive('math'),
      run: (e) => {
        const prev = (e.getAttributes('math').latex as string | undefined) ?? '';
        const latex =
          typeof window !== 'undefined'
            ? window.prompt('Fórmula en LaTeX', prev)
            : null;
        if (latex === null) return;
        const value = latex.trim();
        if (value === '') return;
        if (e.isActive('math')) {
          e.chain().focus().updateAttributes('math', { latex: value }).run();
        } else {
          e.chain().focus().insertContent({ type: 'math', attrs: { latex: value } }).run();
        }
      },
    },
    { id: 'clear', label: 'Limpiar formato', icon: <RemoveFormatting className="size-3.5" />, run: (e) => e.chain().focus().unsetAllMarks().run() },
  ];
  if (onAiAssist) {
    btns.push({
      id: 'ai',
      label: 'Asistente de redacción',
      icon: <Sparkles className="size-3.5" />,
      run: () => onAiAssist(),
    });
  }
  return btns;
}

const wrapperStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 60,
  display: 'flex',
  gap: 2,
  padding: 3,
  borderRadius: 8,
  background: 'var(--popover, #fff)',
  color: 'var(--popover-foreground, #0f172a)',
  border: '1px solid var(--border, #e2e8f0)',
  boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
  transform: 'translate(-50%, -100%)',
};

export interface BubbleToolbarProps {
  editor: Editor | null;
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; below?: boolean } | null>(null);
  const [, forceTick] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const aiOpenRef = useRef(false);
  aiOpenRef.current = aiOpen;
  const lastPosRef = useRef<{ top: number; left: number; below?: boolean } | null>(null);
  const ai = useRichTextAi();
  const openAi = useCallback(() => setAiOpen(true), []);
  const buttonsRef = useRef<ToolbarButton[]>([]);
  buttonsRef.current = buildButtons(ai ? openAi : undefined);

  const recompute = useCallback(() => {
    if (!editor || !editor.isEditable) {
      setPos(null);
      return;
    }
    const { from, to, empty } = editor.state.selection;
    const focusInToolbar =
      typeof document !== 'undefined' && ref.current?.contains(document.activeElement);
    if (!aiOpenRef.current && (empty || (!editor.isFocused && !focusInToolbar))) {
      setPos(null);
      return;
    }
    try {
      const a = editor.view.coordsAtPos(from);
      const b = editor.view.coordsAtPos(to);
      let top = Math.min(a.top, b.top) - 8;
      let left = (a.left + b.left) / 2;
      let below = false;
      // Clamp / flip al viewport: la barra mide ~26px de alto y hasta ~820px de
      // ancho (28 botones). Si no cabe arriba, va debajo de la selección; el
      // ancho se acota a los bordes con un margen de 8px.
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const barW = ref.current?.offsetWidth || 480;
      const half = barW / 2;
      left = Math.max(8 + half, Math.min(vw - 8 - half, left));
      if (top < 44) {
        top = Math.max(a.bottom, b.bottom) + 8;
        below = true;
      }
      const next = { top, left, below };
      lastPosRef.current = next;
      setPos(next);
      forceTick((n) => n + 1);
    } catch {
      if (!aiOpenRef.current) setPos(null);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    // Recalcular en `selectionUpdate` (coalescido a un frame) + scroll/resize.
    // NO en `transaction`: se disparaba en cada pulsación de tecla → un
    // `coordsAtPos` × 2 + re-render del portal por carácter (jank en bloques
    // grandes). `selectionUpdate` cubre el caso real (mover/extender selección).
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recompute();
      });
    };
    recompute();
    editor.on('selectionUpdate', schedule);
    editor.on('focus', schedule);
    editor.on('blur', schedule);
    const onWin = () => schedule();
    window.addEventListener('scroll', onWin, true);
    window.addEventListener('resize', onWin);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      editor.off('selectionUpdate', schedule);
      editor.off('focus', schedule);
      editor.off('blur', schedule);
      window.removeEventListener('scroll', onWin, true);
      window.removeEventListener('resize', onWin);
    };
  }, [editor, recompute]);

  if (!editor || typeof document === 'undefined') return null;

  const buttons = buttonsRef.current;
  const panelPos = pos ?? lastPosRef.current;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    let next = focusIdx;
    if (e.key === 'ArrowRight') next = (focusIdx + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') next = (focusIdx - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else next = buttons.length - 1;
    setFocusIdx(next);
    ref.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  };

  return createPortal(
    <>
    {pos ? (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Formato de texto"
      aria-orientation="horizontal"
      data-rich-text-safe=""
      style={{ ...wrapperStyle, top: pos.top, left: pos.left, transform: pos.below ? "translate(-50%, 0)" : "translate(-50%, -100%)" }}
      onMouseDown={(e) => e.preventDefault()}
      onKeyDown={onKeyDown}
    >
      {buttons.map((b, i) => {
        const active = b.isActive?.(editor) ?? false;
        const disabled = b.isDisabled?.(editor) ?? false;
        return (
          <button
            key={b.id}
            type="button"
            title={b.label}
            aria-label={b.label}
            aria-pressed={b.isActive ? active : undefined}
            disabled={disabled}
            tabIndex={i === focusIdx ? 0 : -1}
            onFocus={() => setFocusIdx(i)}
            onClick={() => {
              b.run(editor);
              recompute();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              border: 'none',
              borderRadius: 6,
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              background: active ? 'var(--accent, #e2e8f0)' : 'transparent',
            }}
          >
            {b.icon}
          </button>
        );
      })}
    </div>
    ) : null}
    {aiOpen && panelPos ? (
      <div
        style={{
          position: 'fixed',
          zIndex: 61,
          top: panelPos.top + 8,
          left: panelPos.left,
          transform: 'translate(-50%, 0)',
        }}
      >
        <AiAssistPanel editor={editor} onClose={() => setAiOpen(false)} />
      </div>
    ) : null}
    </>,
    document.body,
  );
}
