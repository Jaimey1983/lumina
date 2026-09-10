'use client';

import {
  useCallback,
  useEffect,
  useMemo,
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
  EllipsisVertical,
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
import { useRichTextAi } from './ai-context.js';
import { AiAssistPanel } from './ai-assist-panel.js';
import { BubblePopover, type BubblePopoverId } from './bubble-popovers.js';
import {
  TEXT_INDENT_STEP,
  isFirstLineIndent,
  isHangingIndent,
} from './indent.js';

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

const INDENT_STEP = TEXT_INDENT_STEP;
const INDENT_MAX = 9;

function FirstLineIndentIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path strokeLinecap="round" d="M6 3.5h7.5M2.5 8h11M2.5 12.5h11" />
    </svg>
  );
}

function HangingIndentIcon() {
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path strokeLinecap="round" d="M2.5 3.5h11M6 8h7.5M6 12.5h7.5" />
    </svg>
  );
}

function currentBlockType(editor: Editor): 'paragraph' | 'heading' | null {
  const name = editor.state.selection.$from.parent.type.name;
  return name === 'paragraph' || name === 'heading' ? name : null;
}

function changeIndent(editor: Editor, delta: number): void {
  const type = currentBlockType(editor);
  if (!type) return;
  const cur = (editor.getAttributes(type).indent as number | undefined) ?? 0;
  const next = Math.max(0, Math.min(INDENT_MAX, cur + delta));
  editor.chain().focus().updateAttributes(type, { indent: next === 0 ? null : next }).run();
}

function currentTextIndent(editor: Editor): number {
  const type = currentBlockType(editor);
  if (!type) return 0;
  const v = editor.getAttributes(type).textIndent;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function setTextIndent(editor: Editor, next: number | null): void {
  const type = currentBlockType(editor);
  if (!type) return;
  editor.chain().focus().updateAttributes(type, { textIndent: next }).run();
}

/** Primera línea ↔ off. Si había francesa, la sustituye. */
function toggleFirstLineIndent(editor: Editor): void {
  const cur = currentTextIndent(editor);
  setTextIndent(editor, cur > 0 ? null : TEXT_INDENT_STEP);
}

/** Sangría francesa ↔ off. Si había primera línea, la sustituye. */
function toggleHangingIndent(editor: Editor): void {
  const cur = currentTextIndent(editor);
  setTextIndent(editor, cur < 0 ? null : -TEXT_INDENT_STEP);
}

interface ToolbarButton {
  id: string;
  label: string;
  icon: ReactNode;
  isActive?: (e: Editor) => boolean;
  isDisabled?: (e: Editor) => boolean;
  /** Abre un popover en vez de ejecutar `run` (enlace, fórmula, término…). */
  popover?: BubblePopoverId;
  run?: (e: Editor) => void;
}

interface ToolbarGroup {
  id: string;
  buttons: ToolbarButton[];
}

/** Grupos SIEMPRE visibles en línea (con separador entre grupos). */
function primaryGroups(onAiAssist?: () => void): ToolbarGroup[] {
  const groups: ToolbarGroup[] = [
    {
      id: 'format',
      buttons: [
        { id: 'bold', label: 'Negrita', icon: <Bold className="size-3.5" />, isActive: (e) => e.isActive('bold'), run: (e) => e.chain().focus().toggleBold().run() },
        { id: 'italic', label: 'Cursiva', icon: <Italic className="size-3.5" />, isActive: (e) => e.isActive('italic'), run: (e) => e.chain().focus().toggleItalic().run() },
        { id: 'underline', label: 'Subrayado', icon: <Underline className="size-3.5" />, isActive: (e) => e.isActive('underline'), run: (e) => e.chain().focus().toggleUnderline().run() },
        { id: 'strike', label: 'Tachado', icon: <Strikethrough className="size-3.5" />, isActive: (e) => e.isActive('strike'), run: (e) => e.chain().focus().toggleStrike().run() },
        { id: 'code', label: 'Código en línea', icon: <Code className="size-3.5" />, isActive: (e) => e.isActive('code'), run: (e) => e.chain().focus().toggleCode().run() },
        { id: 'sup', label: 'Superíndice', icon: <SupIcon className="size-3.5" />, isActive: (e) => e.isActive('superscript'), run: (e) => e.chain().focus().toggleSuperscript().run() },
        { id: 'sub', label: 'Subíndice', icon: <SubIcon className="size-3.5" />, isActive: (e) => e.isActive('subscript'), run: (e) => e.chain().focus().toggleSubscript().run() },
      ],
    },
    {
      id: 'mark',
      buttons: [
        { id: 'highlight', label: 'Resaltar', icon: <Highlighter className="size-3.5" />, isActive: (e) => e.isActive('highlight'), run: (e) => e.chain().focus().toggleHighlight({ color: HIGHLIGHT_DEFAULT }).run() },
        { id: 'spoiler', label: 'Ocultar respuesta', icon: <EyeOff className="size-3.5" />, isActive: (e) => e.isActive('spoiler'), run: (e) => e.chain().focus().toggleMark('spoiler').run() },
      ],
    },
    {
      id: 'size',
      buttons: [
        { id: 'size-down', label: 'Reducir tamaño', icon: <Minus className="size-3.5" />, run: (e) => setFontSize(e, currentFontSizePx(e) - SIZE_STEP) },
        { id: 'size-up', label: 'Aumentar tamaño', icon: <Plus className="size-3.5" />, run: (e) => setFontSize(e, currentFontSizePx(e) + SIZE_STEP) },
      ],
    },
    {
      id: 'link',
      buttons: [
        { id: 'link', label: 'Enlace', icon: <Link2 className="size-3.5" />, isActive: (e) => e.isActive('link') && typeof e.getAttributes('link').slideRef !== 'number', popover: 'link' },
        { id: 'unlink', label: 'Quitar enlace', icon: <Link2Off className="size-3.5" />, isDisabled: (e) => !e.isActive('link'), run: (e) => e.chain().focus().unsetLink().run() },
      ],
    },
  ];
  if (onAiAssist) {
    groups.push({
      id: 'ai',
      buttons: [
        { id: 'ai', label: 'Asistente de redacción', icon: <Sparkles className="size-3.5" />, run: () => onAiAssist() },
      ],
    });
  }
  return groups;
}

/** Acciones secundarias — detrás del botón «⋯ Más» (con etiqueta de texto). */
function secondaryButtons(): ToolbarButton[] {
  return [
    { id: 'slide-ref', label: 'Ir a diapositiva', icon: <Presentation className="size-3.5" />, isActive: (e) => typeof e.getAttributes('link').slideRef === 'number', popover: 'slideRef' },
    { id: 'term', label: 'Término del glosario', icon: <BookMarked className="size-3.5" />, isActive: (e) => e.isActive('term'), popover: 'term' },
    { id: 'outdent', label: 'Reducir sangría', icon: <Outdent className="size-3.5" />, isDisabled: (e) => !currentBlockType(e) || !e.getAttributes(currentBlockType(e)!).indent, run: (e) => changeIndent(e, -INDENT_STEP) },
    { id: 'indent', label: 'Aumentar sangría', icon: <Indent className="size-3.5" />, isDisabled: (e) => !currentBlockType(e), run: (e) => changeIndent(e, INDENT_STEP) },
    {
      id: 'indent-first',
      label: 'Sangría primera línea',
      icon: <FirstLineIndentIcon />,
      isActive: (e) => isFirstLineIndent(currentTextIndent(e)),
      isDisabled: (e) => !currentBlockType(e),
      run: (e) => toggleFirstLineIndent(e),
    },
    {
      id: 'indent-hanging',
      label: 'Sangría francesa',
      icon: <HangingIndentIcon />,
      isActive: (e) => isHangingIndent(currentTextIndent(e)),
      isDisabled: (e) => !currentBlockType(e),
      run: (e) => toggleHangingIndent(e),
    },
    { id: 'task-list', label: 'Lista de tareas', icon: <ListChecks className="size-3.5" />, isActive: (e) => e.isActive('taskList'), run: (e) => e.chain().focus().toggleTaskList().run() },
    { id: 'callout', label: 'Llamada (nota)', icon: <Info className="size-3.5" />, isActive: (e) => e.isActive('callout'), run: (e) => (e.isActive('callout') ? e.chain().focus().setNode('paragraph').run() : e.chain().focus().setNode('callout', { variant: 'nota' }).run()) },
    { id: 'table', label: 'Insertar / quitar tabla', icon: <TableIcon className="size-3.5" />, isActive: (e) => e.isActive('table'), run: (e) => (e.isActive('table') ? e.chain().focus().deleteTable().run() : e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()) },
    { id: 'code-block', label: 'Bloque de código', icon: <SquareCode className="size-3.5" />, isActive: (e) => e.isActive('codeBlock'), popover: 'codeBlock' },
    { id: 'math', label: 'Fórmula (LaTeX)', icon: <Sigma className="size-3.5" />, isActive: (e) => e.isActive('math'), popover: 'math' },
    { id: 'clear', label: 'Limpiar formato', icon: <RemoveFormatting className="size-3.5" />, run: (e) => e.chain().focus().unsetAllMarks().run() },
  ];
}

const wrapperStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 60,
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: 3,
  borderRadius: 8,
  background: 'var(--popover, #fff)',
  color: 'var(--popover-foreground, #0f172a)',
  border: '1px solid var(--border, #e2e8f0)',
  boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
};

const btnStyle = (active: boolean, disabled: boolean): CSSProperties => ({
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
});

const sepStyle: CSSProperties = {
  width: 1,
  alignSelf: 'stretch',
  margin: '3px 2px',
  background: 'var(--border, #e2e8f0)',
};

export interface BubbleToolbarProps {
  editor: Editor | null;
}

type Pos = { top: number; left: number; below?: boolean };

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [, forceTick] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [popover, setPopover] = useState<BubblePopoverId | null>(null);
  const overlayOpenRef = useRef(false);
  overlayOpenRef.current = aiOpen || moreOpen || popover !== null;
  const lastPosRef = useRef<Pos | null>(null);
  const ai = useRichTextAi();
  const openAi = useCallback(() => {
    setMoreOpen(false);
    setPopover(null);
    setAiOpen(true);
  }, []);

  const groups = useMemo(() => primaryGroups(ai ? openAi : undefined), [ai, openAi]);
  const secondary = useMemo(() => secondaryButtons(), []);
  const flatPrimary = useMemo(() => groups.flatMap((g) => g.buttons), [groups]);
  /** Índices (en `flatPrimary`) donde arranca un grupo nuevo → separador antes. */
  const groupStarts = useMemo(() => {
    const set = new Set<number>();
    let acc = 0;
    for (const g of groups) {
      if (acc > 0) set.add(acc);
      acc += g.buttons.length;
    }
    return set;
  }, [groups]);
  /** Botones navegables por teclado en la fila: primarios + «⋯». */
  const navCount = flatPrimary.length + 1;

  const recompute = useCallback(() => {
    if (!editor || !editor.isEditable) {
      setPos(null);
      return;
    }
    const { from, to, empty } = editor.state.selection;
    const focusInToolbar =
      typeof document !== 'undefined' && ref.current?.contains(document.activeElement);
    if (!overlayOpenRef.current && (empty || (!editor.isFocused && !focusInToolbar))) {
      setPos(null);
      return;
    }
    try {
      const a = editor.view.coordsAtPos(from);
      const b = editor.view.coordsAtPos(to);
      let top = Math.min(a.top, b.top) - 8;
      let left = (a.left + b.left) / 2;
      let below = false;
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const barW = ref.current?.offsetWidth || 420;
      const half = barW / 2;
      left = Math.max(8 + half, Math.min(vw - 8 - half, left));
      if (top < 44) {
        top = Math.max(a.bottom, b.bottom) + 8;
        below = true;
      }
      const next: Pos = { top, left, below };
      lastPosRef.current = next;
      setPos(next);
      forceTick((n) => n + 1);
    } catch {
      if (!overlayOpenRef.current) setPos(null);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
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

  // Cierra los overlays cuando la selección desaparece / cambia el editor.
  useEffect(() => {
    if (!pos) {
      setMoreOpen(false);
      setAiOpen(false);
      setPopover(null);
    }
  }, [pos]);

  if (!editor || typeof document === 'undefined') return null;

  const anchor = pos ?? lastPosRef.current;
  const overlayTop = anchor
    ? anchor.below
      ? anchor.top + 40
      : anchor.top + 6
    : 0;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let next = focusIdx;
    if (e.key === 'ArrowRight') next = (focusIdx + 1) % navCount;
    else if (e.key === 'ArrowLeft') next = (focusIdx - 1 + navCount) % navCount;
    else if (e.key === 'Home') next = 0;
    else next = navCount - 1;
    setFocusIdx(next);
    ref.current?.querySelectorAll<HTMLButtonElement>('button[data-nav]')[next]?.focus();
  };

  const runButton = (b: ToolbarButton) => {
    if (b.popover) {
      setAiOpen(false);
      setMoreOpen(false);
      setPopover(b.popover);
      return;
    }
    b.run?.(editor);
    recompute();
  };

  const renderPrimaryButton = (b: ToolbarButton, i: number) => {
    const active = b.isActive?.(editor) ?? false;
    const disabled = b.isDisabled?.(editor) ?? false;
    return (
      <button
        key={b.id}
        type="button"
        data-nav
        title={b.label}
        aria-label={b.label}
        aria-pressed={b.isActive ? active : undefined}
        aria-haspopup={b.popover ? 'dialog' : undefined}
        disabled={disabled}
        tabIndex={i === focusIdx ? 0 : -1}
        onFocus={() => setFocusIdx(i)}
        onClick={() => !disabled && runButton(b)}
        style={btnStyle(active, disabled)}
      >
        {b.icon}
      </button>
    );
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
          style={{
            ...wrapperStyle,
            top: pos.top,
            left: pos.left,
            transform: pos.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
          onMouseDown={(e) => {
            // No robar el foco al pulsar la barra (salvo en un input de popover).
            const t = e.target as HTMLElement;
            if (!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) e.preventDefault();
          }}
          onKeyDown={onKeyDown}
        >
          {flatPrimary.map((b, i) => (
            <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {groupStarts.has(i) ? <span style={sepStyle} aria-hidden /> : null}
              {renderPrimaryButton(b, i)}
            </span>
          ))}
          <span style={sepStyle} aria-hidden />
          <button
            type="button"
            data-nav
            title="Más opciones"
            aria-label="Más opciones"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            tabIndex={flatPrimary.length === focusIdx ? 0 : -1}
            onFocus={() => setFocusIdx(flatPrimary.length)}
            onClick={() => {
              setAiOpen(false);
              setPopover(null);
              setMoreOpen((v) => !v);
            }}
            style={btnStyle(moreOpen, false)}
          >
            <EllipsisVertical className="size-3.5" />
          </button>
        </div>
      ) : null}

      {moreOpen && anchor ? (
        <div
          role="menu"
          aria-label="Más opciones de formato"
          data-rich-text-safe=""
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            zIndex: 61,
            top: overlayTop,
            left: anchor.left,
            transform: 'translate(-50%, 0)',
            minWidth: 200,
            padding: 4,
            borderRadius: 8,
            background: 'var(--popover, #fff)',
            color: 'var(--popover-foreground, #0f172a)',
            border: '1px solid var(--border, #e2e8f0)',
            boxShadow: '0 10px 30px rgba(15,23,42,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {secondary.map((b) => {
            const active = b.isActive?.(editor) ?? false;
            const disabled = b.isDisabled?.(editor) ?? false;
            return (
              <button
                key={b.id}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  setMoreOpen(false);
                  runButton(b);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  textAlign: 'left',
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  background: active ? 'var(--accent, #e2e8f0)' : 'transparent',
                }}
              >
                {b.icon}
                <span>{b.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {popover && anchor ? (
        <BubblePopover
          id={popover}
          editor={editor}
          pos={{ top: overlayTop, left: anchor.left }}
          onClose={() => {
            setPopover(null);
            editor.chain().focus().run();
            recompute();
          }}
        />
      ) : null}

      {aiOpen && anchor ? (
        <div
          style={{
            position: 'fixed',
            zIndex: 61,
            top: overlayTop,
            left: anchor.left,
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
