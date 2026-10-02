import 'katex/dist/katex.min.css';
import katex from 'katex';

/**
 * Único punto de contacto con KaTeX (Etapa M, DM1). Ningún otro archivo del
 * monorepo importa `katex` directo: así los límites, los macros y la lectura
 * accesible son los mismos en el bloque, el texto enriquecido y el compositor.
 */

/** Tope de tamaños absolutos (em) y de expansión de macros: frena LaTeX hostil o generado por IA. */
export const LATEX_MAX_SIZE = 100;
export const LATEX_MAX_EXPAND = 200;

/** Macros compartidos (conjuntos numéricos). Se copian en cada llamada: KaTeX los muta. */
const SHARED_MACROS: Readonly<Record<string, string>> = {
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
};

export interface RenderLatexOptions {
  /** `true` lanza ante LaTeX inválido (compositor); `false` pinta el error en rojo. */
  throwOnError?: boolean;
  /** Por defecto `true` (fórmula en bloque). */
  display?: boolean;
}

export function renderLatex(latex: string, opts: RenderLatexOptions = {}): string {
  return katex.renderToString(latex, {
    throwOnError: opts.throwOnError ?? false,
    displayMode: opts.display ?? true,
    output: 'htmlAndMathml',
    strict: 'ignore',
    trust: false,
    maxSize: LATEX_MAX_SIZE,
    maxExpand: LATEX_MAX_EXPAND,
    macros: { ...SHARED_MACROS },
  });
}

const SYMBOLS: ReadonlyArray<[RegExp, string]> = [
  [/\\times\b/g, ' por '],
  [/\\cdot\b/g, ' por '],
  [/\\div\b/g, ' entre '],
  [/\\pm\b/g, ' más menos '],
  [/\\leq?\b/g, ' menor o igual que '],
  [/\\geq?\b/g, ' mayor o igual que '],
  [/\\neq\b/g, ' distinto de '],
  [/\\approx\b/g, ' aproximadamente '],
  [/\\to\b/g, ' tiende a '],
  [/\\infty\b/g, ' infinito '],
  [/\\pi\b/g, ' pi '],
  [/\\sum\b/g, ' sumatoria '],
  [/\\prod\b/g, ' productoria '],
  [/\\int\b/g, ' integral '],
  [/\\lim\b/g, ' límite '],
  [/\\ln\b/g, ' logaritmo natural '],
  [/\\log\b/g, ' logaritmo '],
  [/\\(?:sin)\b/g, ' seno '],
  [/\\(?:cos)\b/g, ' coseno '],
  [/\\(?:tan)\b/g, ' tangente '],
  [/\\in\b/g, ' pertenece a '],
  [/\\cup\b/g, ' unión '],
  [/\\cap\b/g, ' intersección '],
  [/\\Rightarrow\b/g, ' implica '],
  [/\\Leftrightarrow\b/g, ' si y solo si '],
  [/\\%/g, ' por ciento '],
  [/\\mathbb\{R\}/g, ' reales '],
  [/\\mathbb\{N\}/g, ' naturales '],
  [/\\mathbb\{Z\}/g, ' enteros '],
  [/\\mathbb\{Q\}/g, ' racionales '],
];

/** Reescrituras de estructura sobre grupos sin llaves anidadas; se repiten hasta estabilizar. */
const STRUCTURE: ReadonlyArray<[RegExp, string | ((...m: string[]) => string)]> = [
  [/\^\s*\{\\circ\}/g, ' grados '],
  [/\^\s*\{\s*2\s*\}|\^\s*2(?![0-9])/g, ' al cuadrado '],
  [/\^\s*\{\s*3\s*\}|\^\s*3(?![0-9])/g, ' al cubo '],
  [/\^\s*\{([^{}]*)\}/g, ' elevado a $1 '],
  [/\^\s*([A-Za-z0-9])/g, ' elevado a $1 '],
  [/_\s*\{([^{}]*)\}/g, ' sub $1 '],
  [/_\s*([A-Za-z0-9])/g, ' sub $1 '],
  [/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, ' raíz de índice $1 de $2 '],
  [/\\sqrt\s*\{([^{}]*)\}/g, ' raíz cuadrada de $1 '],
  [/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, ' $1 sobre $2 '],
  [/\\binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, ' combinaciones de $1 en $2 '],
  [/\\(?:text|mathrm|mathbf|operatorname)\s*\{([^{}]*)\}/g, ' $1 '],
];

/**
 * Lectura en español de una fórmula LaTeX, para lectores de pantalla. No es un
 * intérprete completo: lo que no reconoce se lee sin la barra invertida.
 */
export function speakLatex(latex: string): string {
  let s = ` ${latex} `
    .replace(/\\left|\\right/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\\\/g, ', ')
    .replace(/&/g, ' ');
  for (const [re, to] of SYMBOLS) s = s.replace(re, to);
  for (let i = 0; i < 20; i++) {
    const before = s;
    for (const [re, to] of STRUCTURE) s = s.replace(re, to as string);
    if (s === before) break;
  }
  s = s
    .replace(/\\begin\{[^}]*\}|\\end\{[^}]*\}/g, ' ')
    .replace(/\\([A-Za-z]+)/g, ' $1 ')
    .replace(/[{}]/g, ' ')
    .replace(/=/g, ' igual a ')
    .replace(/\+/g, ' más ')
    .replace(/(?<=\S\s*)-/g, ' menos ')
    .replace(/^\s*-/, ' menos ')
    .replace(/</g, ' menor que ')
    .replace(/>/g, ' mayor que ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}
