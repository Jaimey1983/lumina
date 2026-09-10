'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { Editor } from '@tiptap/core';
import { isSafeHref } from './sanitize.js';

/**
 * Popovers inline de la barra flotante (Fase 6) — sustituyen a los
 * `window.prompt` de enlace / ir-a-diapositiva / término / fórmula / lenguaje.
 * Todos son `data-rich-text-safe` (el editor no se cierra mientras están
 * abiertos) y devuelven el foco al editor al aplicar/cancelar.
 */

const shell: CSSProperties = {
  position: 'fixed',
  zIndex: 62,
  minWidth: 220,
  maxWidth: 340,
  padding: 10,
  borderRadius: 8,
  background: 'var(--popover, #fff)',
  color: 'var(--popover-foreground, #0f172a)',
  border: '1px solid var(--border, #e2e8f0)',
  boxShadow: '0 10px 30px rgba(15,23,42,0.2)',
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const inputStyle: CSSProperties = {
  width: '100%',
  height: 28,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid var(--border, #cbd5e1)',
  background: 'var(--background, #fff)',
  color: 'inherit',
  fontSize: 12,
  boxSizing: 'border-box',
};

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>{children}</div>;
}

function Btn({
  children,
  onClick,
  variant = 'ghost',
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const v: CSSProperties =
    variant === 'primary'
      ? { background: 'var(--primary, #2563eb)', color: 'var(--primary-foreground, #fff)' }
      : variant === 'danger'
        ? { background: 'transparent', color: '#b91c1c' }
        : { background: 'transparent', color: 'inherit' };
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...v,
        border: 'none',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export interface PopoverShellProps {
  editor: Editor;
  pos: { top: number; left: number };
  onClose: () => void;
}

function PopoverFrame({
  pos,
  onClose,
  label,
  children,
  onSubmit,
}: PopoverShellProps & { label: string; children: ReactNode; onSubmit?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input, textarea, select')?.focus();
  }, []);
  return (
    <div
      ref={ref}
      data-rich-text-safe=""
      role="dialog"
      aria-label={label}
      style={{ ...shell, top: pos.top, left: pos.left, transform: 'translate(-50%, 0)' }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        } else if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }}
    >
      {children}
    </div>
  );
}

// ─── Enlace ──────────────────────────────────────────────────────────────────

export function LinkPopover({ editor, pos, onClose }: PopoverShellProps) {
  const [value, setValue] = useState(
    (editor.getAttributes('link').href as string | undefined) ?? '',
  );
  const trimmed = value.trim();
  const valid = trimmed === '' || isSafeHref(trimmed);

  const apply = () => {
    if (trimmed === '') editor.chain().focus().unsetLink().run();
    else if (isSafeHref(trimmed))
      editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
    onClose();
  };

  return (
    <PopoverFrame editor={editor} pos={pos} onClose={onClose} label="Enlace" onSubmit={apply}>
      <label style={{ fontWeight: 600 }}>Dirección del enlace</label>
      <input
        style={{ ...inputStyle, borderColor: valid ? undefined : '#dc2626' }}
        type="url"
        placeholder="https://…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {!valid ? (
        <span style={{ color: '#dc2626', fontSize: 11 }}>
          Solo http/https, mailto, tel o rutas del sitio.
        </span>
      ) : null}
      <Row>
        {editor.isActive('link') ? (
          <Btn
            variant="danger"
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              onClose();
            }}
          >
            Quitar
          </Btn>
        ) : null}
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={apply}>
          Aplicar
        </Btn>
      </Row>
    </PopoverFrame>
  );
}

// ─── Ir a diapositiva ────────────────────────────────────────────────────────

export function SlideRefPopover({ editor, pos, onClose }: PopoverShellProps) {
  const [value, setValue] = useState(
    (() => {
      const n = editor.getAttributes('link').slideRef;
      return typeof n === 'number' ? String(n) : '';
    })(),
  );
  const n = Math.round(Number(value.trim()));
  const valid = Number.isFinite(n) && n >= 1;

  const apply = () => {
    if (!valid) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setMark('link', { href: null, slideRef: n })
        .run();
    }
    onClose();
  };

  return (
    <PopoverFrame
      editor={editor}
      pos={pos}
      onClose={onClose}
      label="Ir a diapositiva"
      onSubmit={apply}
    >
      <label style={{ fontWeight: 600 }}>Número de diapositiva</label>
      <input
        style={inputStyle}
        type="number"
        min={1}
        placeholder="Ej. 4"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Row>
        {editor.isActive('link') ? (
          <Btn
            variant="danger"
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              onClose();
            }}
          >
            Quitar
          </Btn>
        ) : null}
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={apply}>
          Aplicar
        </Btn>
      </Row>
    </PopoverFrame>
  );
}

// ─── Término del glosario ────────────────────────────────────────────────────

export function TermPopover({ editor, pos, onClose }: PopoverShellProps) {
  const [value, setValue] = useState(
    (editor.getAttributes('term').definicion as string | undefined) ?? '',
  );
  const apply = () => {
    const def = value.trim();
    const glosaId =
      (editor.getAttributes('term').glosaId as string | undefined) ??
      `t-${Math.random().toString(36).slice(2, 9)}`;
    editor
      .chain()
      .focus()
      .setMark('term', { glosaId, definicion: def === '' ? null : def })
      .run();
    onClose();
  };
  return (
    <PopoverFrame
      editor={editor}
      pos={pos}
      onClose={onClose}
      label="Término del glosario"
      onSubmit={apply}
    >
      <label style={{ fontWeight: 600 }}>Definición del término</label>
      <textarea
        style={{ ...inputStyle, height: 56, padding: 6, resize: 'vertical' }}
        placeholder="Explicación breve que verá el alumno al pasar el cursor"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Row>
        {editor.isActive('term') ? (
          <Btn
            variant="danger"
            onClick={() => {
              editor.chain().focus().unsetMark('term').run();
              onClose();
            }}
          >
            Quitar
          </Btn>
        ) : null}
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={apply}>
          Aplicar
        </Btn>
      </Row>
    </PopoverFrame>
  );
}

// ─── Bloque de código (lenguaje) ─────────────────────────────────────────────

const CODE_LANGS = [
  '',
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'php',
  'ruby',
  'sql',
  'bash',
  'json',
  'html',
  'css',
  'xml',
  'yaml',
  'markdown',
];

export function CodeBlockPopover({ editor, pos, onClose }: PopoverShellProps) {
  const [lang, setLang] = useState(
    (editor.getAttributes('codeBlock').language as string | undefined) ?? '',
  );
  const apply = () => {
    const chain = editor.chain().focus();
    if (editor.isActive('codeBlock')) {
      chain.updateAttributes('codeBlock', { language: lang || null }).run();
    } else if (lang) {
      chain.toggleCodeBlock({ language: lang }).run();
    } else {
      chain.toggleCodeBlock().run();
    }
    onClose();
  };
  return (
    <PopoverFrame
      editor={editor}
      pos={pos}
      onClose={onClose}
      label="Bloque de código"
      onSubmit={apply}
    >
      <label style={{ fontWeight: 600 }}>Lenguaje</label>
      <select
        style={inputStyle}
        value={lang}
        onChange={(e) => setLang(e.target.value)}
      >
        {CODE_LANGS.map((l) => (
          <option key={l || 'plain'} value={l}>
            {l === '' ? 'Texto plano' : l}
          </option>
        ))}
      </select>
      <Row>
        {editor.isActive('codeBlock') ? (
          <Btn
            variant="danger"
            onClick={() => {
              editor.chain().focus().toggleCodeBlock().run();
              onClose();
            }}
          >
            Quitar bloque
          </Btn>
        ) : null}
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={apply}>
          {editor.isActive('codeBlock') ? 'Aplicar' : 'Insertar'}
        </Btn>
      </Row>
    </PopoverFrame>
  );
}

// ─── Fórmula LaTeX (con preview en vivo) ─────────────────────────────────────

type KatexModule = { renderToString: (tex: string, opts?: Record<string, unknown>) => string };

export function MathPopover({ editor, pos, onClose }: PopoverShellProps) {
  const [value, setValue] = useState(
    (editor.getAttributes('math').latex as string | undefined) ?? '',
  );
  const [katex, setKatex] = useState<KatexModule | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css').catch(() => null),
    ])
      .then(([m]) => {
        if (alive) setKatex((m as { default: KatexModule }).default);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const preview = useMemo(() => {
    const tex = value.trim();
    if (!katex || tex === '') return null;
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: true,
        output: 'html',
      });
    } catch {
      return null;
    }
  }, [katex, value]);

  const apply = () => {
    const tex = value.trim();
    if (tex === '') {
      onClose();
      return;
    }
    if (editor.isActive('math')) {
      editor.chain().focus().updateAttributes('math', { latex: tex }).run();
    } else {
      editor.chain().focus().insertContent({ type: 'math', attrs: { latex: tex } }).run();
    }
    onClose();
  };

  return (
    <PopoverFrame
      editor={editor}
      pos={pos}
      onClose={onClose}
      label="Fórmula LaTeX"
      onSubmit={apply}
    >
      <label style={{ fontWeight: 600 }}>Fórmula en LaTeX</label>
      <textarea
        style={{ ...inputStyle, height: 52, padding: 6, fontFamily: 'monospace', resize: 'vertical' }}
        placeholder="\\frac{a}{b} = c^2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div
        style={{
          minHeight: 40,
          padding: 8,
          borderRadius: 6,
          background: 'var(--muted, #f8fafc)',
          overflowX: 'auto',
          textAlign: 'center',
        }}
        aria-live="polite"
      >
        {preview ? (
          <span dangerouslySetInnerHTML={{ __html: preview }} />
        ) : (
          <span style={{ color: 'var(--muted-foreground, #94a3b8)', fontFamily: 'monospace' }}>
            {value.trim() === '' ? 'Vista previa' : value}
          </span>
        )}
      </div>
      <Row>
        {editor.isActive('math') ? (
          <Btn
            variant="danger"
            onClick={() => {
              editor.chain().focus().deleteSelection().run();
              onClose();
            }}
          >
            Quitar
          </Btn>
        ) : null}
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={apply}>
          {editor.isActive('math') ? 'Aplicar' : 'Insertar'}
        </Btn>
      </Row>
    </PopoverFrame>
  );
}

export type BubblePopoverId = 'link' | 'slideRef' | 'term' | 'codeBlock' | 'math';

export function BubblePopover({
  id,
  ...props
}: PopoverShellProps & { id: BubblePopoverId }) {
  switch (id) {
    case 'link':
      return <LinkPopover {...props} />;
    case 'slideRef':
      return <SlideRefPopover {...props} />;
    case 'term':
      return <TermPopover {...props} />;
    case 'codeBlock':
      return <CodeBlockPopover {...props} />;
    case 'math':
      return <MathPopover {...props} />;
  }
}
