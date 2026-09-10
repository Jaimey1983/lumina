'use client';

import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

/**
 * Renderiza una fórmula LaTeX con KaTeX. Este módulo se carga de forma perezosa
 * (`React.lazy` desde `render-texto`) — KaTeX y su CSS solo entran al bundle
 * cuando un documento tiene un nodo `math`.
 */
export function MathBlock({ latex }: { latex: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setHtml(
        katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        }),
      );
      setError(false);
    } catch {
      setError(true);
    }
  }, [latex]);

  if (error || html === null) {
    return (
      <div data-math="1" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {latex}
      </div>
    );
  }
  return (
    <div
      data-math="1"
      style={{ overflowX: 'auto', textAlign: 'center', margin: '0.4em 0' }}
      // KaTeX produce marcado seguro (spans con clases); el LaTeX de entrada ya
      // pasó por `sanitizeRichDoc`.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathBlock;
