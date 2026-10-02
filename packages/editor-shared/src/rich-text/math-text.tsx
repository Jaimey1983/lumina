'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Texto con fórmulas en línea (Etapa M / M3b). Las fórmulas van entre `\( … \)`
 * (delimitador estándar de LaTeX): el texto corriente casi nunca lo contiene,
 * así que un texto SIN delimitadores se devuelve tal cual y todo lo que ya
 * existe se ve idéntico. KaTeX se carga de forma perezosa solo si hay fórmulas.
 */

export type TrozoTexto = { tipo: 'texto' | 'mate'; valor: string };

const FORMULA = /\\\(([\s\S]+?)\\\)/g;
const MAX_FORMULAS = 20;

/** Parte un texto en trozos de texto y de fórmula. Sin delimitadores → un solo trozo de texto. */
export function partirTextoMatematico(texto: string): TrozoTexto[] {
  const out: TrozoTexto[] = [];
  let ultimo = 0;
  let n = 0;
  for (const m of texto.matchAll(FORMULA)) {
    if (n >= MAX_FORMULAS) break;
    const inicio = m.index ?? 0;
    if (inicio > ultimo) out.push({ tipo: 'texto', valor: texto.slice(ultimo, inicio) });
    out.push({ tipo: 'mate', valor: m[1]!.trim() });
    ultimo = inicio + m[0].length;
    n++;
  }
  if (ultimo < texto.length) out.push({ tipo: 'texto', valor: texto.slice(ultimo) });
  return out.length > 0 ? out : [{ tipo: 'texto', valor: texto }];
}

export function tieneFormulas(texto: string): boolean {
  return texto.includes('\\(');
}

type Render = {
  renderLatex: (l: string, o?: { display?: boolean }) => string;
  speakLatex: (l: string) => string;
};

function FormulaEnLinea({ latex }: { latex: string }) {
  const [mod, setMod] = useState<Render | null>(null);
  useEffect(() => {
    let vivo = true;
    import('./latex-render.js')
      .then((m) => {
        if (vivo) setMod({ renderLatex: m.renderLatex, speakLatex: m.speakLatex });
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  if (!mod) return <span style={{ fontFamily: 'monospace' }}>{latex}</span>;
  return (
    <span
      role="img"
      aria-label={mod.speakLatex(latex)}
      data-math-inline="1"
      // KaTeX produce marcado seguro (spans con clases, sin scripts).
      dangerouslySetInnerHTML={{ __html: mod.renderLatex(latex, { display: false }) }}
    />
  );
}

export function MathText({ text }: { text: string }): ReactNode {
  if (!tieneFormulas(text)) return text;
  return (
    <>
      {partirTextoMatematico(text).map((t, i) =>
        t.tipo === 'texto' ? <span key={i}>{t.valor}</span> : <FormulaEnLinea key={i} latex={t.valor} />,
      )}
    </>
  );
}
