'use client';

import {
  createElement,
  useState,
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import type { TextBlock } from '@/types/slide.types';
import { typographyFromTextBlock, typographyToCss } from '@/lib/typography';
import { resolveFontFamily } from '@/lib/font-catalog';

export const TEXT_ALIGN_MAP: Record<string, CSSProperties['textAlign']> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
  justificado: 'justify',
};

export function textBlockContenidoIsEmpty(block: TextBlock): boolean {
  const c = block.contenido;
  return c === undefined || c === '';
}

export function textBlockFontSizePx(block: TextBlock): number {
  const raw = block.tamanoFuente ?? '';
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]!) : 0;
}

export function emptyTextPlaceholderLabel(block: TextBlock): string {
  return textBlockFontSizePx(block) >= 28
    ? 'Haga clic para agregar título'
    : 'Haga clic para editar · Shift+Enter para confirmar';
}

/** Estilos opcionales del JSON de texto: solo se añaden si el campo viene definido. */
export function textBlockOptionalVisualStyle(block: TextBlock): CSSProperties {
  const out: CSSProperties = {
    ...typographyToCss(typographyFromTextBlock(block)),
  };
  if (block.fuente !== undefined && block.fuente !== '') {
    out.fontFamily = resolveFontFamily(block.fuente);
  }
  if (block.subrayado === true) {
    out.textDecoration = 'underline';
  }
  if (block.interlineado !== undefined) {
    out.lineHeight = block.interlineado;
  }
  if (block.espaciadoLetras !== undefined) {
    out.letterSpacing = `${block.espaciadoLetras}px`;
  }
  return out;
}

export function InlineTextEditor({
  block,
  onCommit,
  onDiscard,
}: {
  block: TextBlock;
  onCommit: (text: string) => void;
  onDiscard: () => void;
}) {
  const [value, setValue] = useState(block.contenido ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Guards against double-fire from blur + Enter/Escape. */
  const exitedRef = useRef(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.select();
  }, []);

  function commit() {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onCommit(value);
  }

  function discard() {
    if (exitedRef.current) return;
    exitedRef.current = true;
    onDiscard();
  }

  const isEmpty = value === '';

  return (
    <div
      className="relative h-full w-full min-h-0"
      style={
        isEmpty
          ? { border: '2px dashed #aaa', boxSizing: 'border-box' }
          : undefined
      }
    >
      {isEmpty && (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 block w-[calc(100%-8px)] max-w-full -translate-x-1/2 -translate-y-1/2 px-1 text-center leading-snug"
          style={{
            color: '#bbb',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
          }}
        >
          {emptyTextPlaceholderLabel(block)}
        </span>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            discard();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: '2px',
          border: 'none',
          outline: 'none',
          background: isEmpty ? 'transparent' : 'rgba(255,255,255,0.05)',
          resize: 'none',
          cursor: 'text',
          fontSize: block.tamanoFuente,
          fontWeight: block.negrita ? 'bold' : 'normal',
          fontStyle: block.cursiva ? 'italic' : 'normal',
          color: block.color ?? 'inherit',
          textAlign: block.alineacion
            ? (TEXT_ALIGN_MAP[block.alineacion] ?? 'left')
            : 'left',
          overflowY: 'auto',
          boxSizing: 'border-box',
          zIndex: 1,
          ...textBlockOptionalVisualStyle(block),
        }}
      />
    </div>
  );
}

export interface RenderTextProps {
  block: TextBlock;
  modo?: 'editor' | 'viewer';
  isEditing?: boolean;
  onCommit?: (text: string) => void;
  onDiscard?: () => void;
}

export function RenderText({
  block,
  modo = 'viewer',
  isEditing,
  onCommit,
  onDiscard,
}: RenderTextProps) {
  if (isEditing && onCommit && onDiscard) {
    return (
      <InlineTextEditor
        block={block}
        onCommit={onCommit}
        onDiscard={onDiscard}
      />
    );
  }

  if (modo === 'editor' && textBlockContenidoIsEmpty(block)) {
    return (
      <div
        className="relative box-border h-full min-h-[1.25em] w-full"
        style={{ border: '2px dashed #aaa' }}
      >
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 block w-[calc(100%-8px)] max-w-full -translate-x-1/2 -translate-y-1/2 px-1 text-center leading-snug"
          style={{
            color: '#bbb',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
          }}
        >
          {emptyTextPlaceholderLabel(block)}
        </span>
      </div>
    );
  }

  const isList = block.lista === 'vinetas' || block.lista === 'numeros';
  const style: CSSProperties = {
    margin: 0,
    whiteSpace: isList ? 'normal' : 'pre-wrap',
    wordBreak: 'break-word',
    textAlign: block.alineacion ? TEXT_ALIGN_MAP[block.alineacion] : undefined,
    fontSize: block.tamanoFuente,
    fontWeight: block.negrita ? 'bold' : undefined,
    fontStyle: block.cursiva ? 'italic' : undefined,
    color: block.color,
    ...textBlockOptionalVisualStyle(block),
    ...(isList
      ? {
          paddingLeft: '1.2em',
          listStyleType: block.lista === 'numeros' ? 'decimal' : 'disc',
        }
      : {}),
  };
  const tag = isList
    ? block.lista === 'numeros'
      ? 'ol'
      : 'ul'
    : block.nivel
      ? `h${block.nivel}`
      : 'p';
  const children = isList
    ? (block.contenido ?? '')
        .split('\n')
        .map((line, i) =>
          createElement('li', { key: i }, line === '' ? '\u00a0' : line),
        )
    : block.contenido;
  return createElement(tag, { style }, children);
}
