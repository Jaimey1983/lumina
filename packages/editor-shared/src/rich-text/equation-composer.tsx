'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  MATH_PALETTE,
  MATH_TABS,
  applyMathTemplate,
  deleteMathAt,
  nextMathSlot,
  type MathTemplate,
} from './equation-insert.js';

type KatexModule = {
  renderToString: (tex: string, opts?: Record<string, unknown>) => string;
};

export interface EquationComposerProps {
  value: string;
  onChange: (next: string) => void;
  /** `popover` achica la vista previa para la barra del texto. */
  density?: 'panel' | 'popover';
  /** Avisa si la fórmula actual es inválida (para bloquear «Insertar»). */
  onErrorChange?: (error: string | null) => void;
}

const HISTORY_MAX = 100;

const previewBox = (density: 'panel' | 'popover'): CSSProperties => ({
  minHeight: density === 'panel' ? 88 : 56,
  padding: '10px 8px',
  borderRadius: 8,
  background: 'var(--muted, #f8fafc)',
  border: '1px solid var(--border, #e2e8f0)',
  overflowX: 'auto',
  textAlign: 'center',
  fontSize: density === 'panel' ? 22 : 18,
});

const tokenBtn: CSSProperties = {
  minWidth: 36,
  height: 32,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid var(--border, #cbd5e1)',
  background: 'var(--background, #fff)',
  color: 'inherit',
  fontSize: 13,
  lineHeight: 1,
  cursor: 'pointer',
};

const tabBtn = (active: boolean): CSSProperties => ({
  height: 26,
  padding: '0 9px',
  borderRadius: 999,
  border: '1px solid var(--border, #cbd5e1)',
  background: active ? 'var(--primary, #2563eb)' : 'var(--background, #fff)',
  color: active ? 'var(--primary-foreground, #fff)' : 'inherit',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

/** Mensaje de error de KaTeX sin el prefijo técnico. */
function cleanKatexError(message: string): string {
  return message.replace(/^KaTeX parse error:\s*/i, '').split('\n')[0] ?? message;
}

/**
 * Teclado visual de ecuaciones: pestañas de símbolos y estructuras, vista previa
 * KaTeX con error visible, deshacer/rehacer propio y Tab para saltar entre
 * huecos (numerador → denominador). El docente escribe números y letras; los
 * botones arman raíz, fracción, potencia, paréntesis y fórmulas completas.
 */
export function EquationComposer({
  value,
  onChange,
  density = 'panel',
  onErrorChange,
}: EquationComposerProps) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<{ start: number; end: number } | null>(null);
  const [katex, setKatex] = useState<KatexModule | null>(null);
  const [tabId, setTabId] = useState(MATH_TABS[0]!.id);
  const pastRef = useRef<string[]>([]);
  const futureRef = useRef<string[]>([]);
  const lastEmitted = useRef(value);
  const [, setHistoryTick] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([import('katex'), import('katex/dist/katex.min.css').catch(() => null)])
      .then(([m]) => {
        if (alive) setKatex((m as { default: KatexModule }).default);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    const pending = caretRef.current;
    const el = areaRef.current;
    if (!pending || !el) return;
    el.focus();
    el.setSelectionRange(pending.start, pending.end);
    caretRef.current = null;
  }, [value]);

  // Un cambio externo (otro bloque, deshacer del lienzo) reinicia el historial.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      pastRef.current = [];
      futureRef.current = [];
      lastEmitted.current = value;
      setHistoryTick((n) => n + 1);
    }
  }, [value]);

  const rendered = useMemo(() => {
    const tex = value.trim();
    if (!katex || tex === '') return { html: null as string | null, error: null as string | null };
    try {
      return {
        html: katex.renderToString(tex, {
          throwOnError: true,
          displayMode: true,
          output: 'html',
        }),
        error: null,
      };
    } catch (e) {
      return {
        html: null,
        error: cleanKatexError(e instanceof Error ? e.message : String(e)),
      };
    }
  }, [katex, value]);

  const errorRef = useRef(onErrorChange);
  errorRef.current = onErrorChange;
  useEffect(() => {
    errorRef.current?.(rendered.error);
  }, [rendered.error]);

  const commit = (next: string) => {
    if (next === value) return;
    pastRef.current = [...pastRef.current.slice(-(HISTORY_MAX - 1)), value];
    futureRef.current = [];
    lastEmitted.current = next;
    onChange(next);
    setHistoryTick((n) => n + 1);
  };

  const place = (next: { value: string; caret: number; caretEnd: number }) => {
    caretRef.current = { start: next.caret, end: next.caretEnd };
    commit(next.value);
  };

  const undo = () => {
    const prev = pastRef.current[pastRef.current.length - 1];
    if (prev === undefined) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [value, ...futureRef.current];
    lastEmitted.current = prev;
    caretRef.current = { start: prev.length, end: prev.length };
    onChange(prev);
    setHistoryTick((n) => n + 1);
  };

  const redo = () => {
    const next = futureRef.current[0];
    if (next === undefined) return;
    futureRef.current = futureRef.current.slice(1);
    pastRef.current = [...pastRef.current, value];
    lastEmitted.current = next;
    caretRef.current = { start: next.length, end: next.length };
    onChange(next);
    setHistoryTick((n) => n + 1);
  };

  const selection = () => {
    const el = areaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    return { start, end };
  };

  const insert = (template: string) => {
    const { start, end } = selection();
    place(applyMathTemplate(value, start, end, template));
  };

  const templateById = (id: string) =>
    MATH_PALETTE.flatMap((g) => g.items).find((item) => item.id === id)?.template ?? '';

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.preventDefault();
    if (e.key === '^' || e.key === '_') {
      e.preventDefault();
      const { start, end } = selection();
      place(applyMathTemplate(value, start, end, templateById(e.key === '^' ? 'sup' : 'sub')));
      return;
    }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      const { end } = selection();
      const target = nextMathSlot(value, end);
      if (target !== null) {
        e.preventDefault();
        areaRef.current?.setSelectionRange(target, target);
      }
    }
  };

  const tab = MATH_TABS.find((t) => t.id === tabId) ?? MATH_TABS[0]!;
  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return (
    <div data-equation-composer="" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div data-equation-preview="" style={previewBox(density)} aria-live="polite">
        {rendered.html ? (
          <span dangerouslySetInnerHTML={{ __html: rendered.html }} />
        ) : (
          <span style={{ color: 'var(--muted-foreground, #94a3b8)', fontSize: 12 }}>
            {value.trim() === '' ? 'La ecuación se ve aquí' : rendered.error ? '…' : value}
          </span>
        )}
      </div>
      {rendered.error ? (
        <div
          role="alert"
          data-equation-error=""
          style={{
            fontSize: 11,
            lineHeight: 1.35,
            color: 'var(--destructive, #dc2626)',
            background: 'color-mix(in srgb, var(--destructive, #dc2626) 8%, transparent)',
            borderRadius: 6,
            padding: '5px 8px',
          }}
        >
          Revisa la fórmula: {rendered.error}
        </div>
      ) : null}

      <div role="tablist" aria-label="Categorías de símbolos" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {MATH_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab.id}
            data-math-tab={t.id}
            style={tabBtn(t.id === tab.id)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTabId(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab.groups.map((group) => (
        <div key={group.id}>
          <div
            style={{
              marginBottom: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--muted-foreground, #64748b)',
            }}
          >
            {group.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {group.items.map((item) => (
              <TokenButton key={item.id} item={item} onInsert={insert} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          style={{ ...tokenBtn, opacity: canUndo ? 1 : 0.4 }}
          title="Deshacer (Ctrl+Z)"
          aria-label="Deshacer"
          disabled={!canUndo}
          onMouseDown={(e) => e.preventDefault()}
          onClick={undo}
        >
          ↶
        </button>
        <button
          type="button"
          style={{ ...tokenBtn, opacity: canRedo ? 1 : 0.4 }}
          title="Rehacer (Ctrl+Y)"
          aria-label="Rehacer"
          disabled={!canRedo}
          onMouseDown={(e) => e.preventDefault()}
          onClick={redo}
        >
          ↷
        </button>
        <button
          type="button"
          style={tokenBtn}
          title="Borrar el carácter anterior"
          aria-label="Borrar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const { start, end } = selection();
            place(deleteMathAt(value, start, end));
          }}
        >
          ⌫
        </button>
        <button
          type="button"
          style={{ ...tokenBtn, marginLeft: 'auto' }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => place({ value: '', caret: 0, caretEnd: 0 })}
        >
          Vaciar
        </button>
      </div>

      <label style={{ fontSize: 11, color: 'var(--muted-foreground, #64748b)' }}>
        Escribe números y letras. ^ potencia, _ subíndice; Tab salta al siguiente hueco. Los botones
        arman raíz, fracción, paréntesis y fórmulas completas.
        <textarea
          ref={areaRef}
          data-equation-source=""
          value={value}
          onChange={(e) => commit(e.target.value)}
          onKeyDown={onKeyDown}
          rows={density === 'panel' ? 3 : 2}
          spellCheck={false}
          // Sin esto Chrome trata el campo numérico como dato de pago y abre Google Wallet.
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          data-form-type="other"
          data-lpignore="true"
          name="equation-source"
          placeholder="2x + 3 = 7"
          style={{
            display: 'block',
            width: '100%',
            marginTop: 4,
            padding: 6,
            borderRadius: 6,
            border: '1px solid var(--border, #cbd5e1)',
            background: 'var(--background, #fff)',
            color: 'inherit',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </label>
    </div>
  );
}

function TokenButton({
  item,
  onInsert,
}: {
  item: MathTemplate;
  onInsert: (template: string) => void;
}) {
  return (
    <button
      type="button"
      title={item.title}
      aria-label={item.title}
      data-math-token={item.id}
      style={tokenBtn}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onInsert(item.template)}
    >
      {item.label}
    </button>
  );
}
