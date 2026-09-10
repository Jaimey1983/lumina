'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import 'highlight.js/styles/github.css';
import { createLowlight, common } from 'lowlight';
import { toHtml } from 'hast-util-to-html';

const lowlight = createLowlight(common);

/**
 * Bloque de código con resaltado de sintaxis (lowlight/highlight.js). Carga
 * perezosa desde `render-texto` — lowlight + el tema CSS solo entran al bundle
 * cuando un documento tiene un nodo `codeBlock`.
 */
export function CodeBlock({
  code,
  lang,
  style,
}: {
  code: string;
  lang?: string;
  style?: CSSProperties;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tree =
        lang && lowlight.registered(lang)
          ? lowlight.highlight(lang, code)
          : lowlight.highlightAuto(code);
      setHtml(toHtml(tree));
    } catch {
      setHtml(null);
    }
  }, [code, lang]);

  return (
    <pre style={style}>
      <code
        className={`hljs${lang ? ` language-${lang}` : ''}`}
        {...(html !== null
          ? { dangerouslySetInnerHTML: { __html: html } }
          : { children: code })}
      />
    </pre>
  );
}

export default CodeBlock;
